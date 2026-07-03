# backend/app/utils/subscription_expiry_checker.py
#
# Runs once per day (triggered at app startup via a background thread,
# and also callable manually via POST /api/notifications/system/check-expiry).
#
# For every active subscription it fires an ADMIN notification on exactly
# these milestones (days before end_date):  3 · 2 · 1 · 0 (expiry day).
#
# Duplicate-guard: before creating a notification it checks whether one
# with the same title tag was already sent today, so re-running the job
# multiple times in a day is idempotent.

import threading
import time
import logging
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# The four alert milestones (days remaining → human label)
ALERT_DAYS: dict[int, str] = {
    3: "in 3 days",
    2: "in 2 days",
    1: "tomorrow",
    0: "today",
}


# ------------------------------------------------------------------ #
#  Core job                                                            #
# ------------------------------------------------------------------ #

def check_subscription_expiries(db: Session) -> dict:
    """
    Scan every active subscription and send admin notifications for
    subscriptions expiring in exactly 3, 2, 1, or 0 days.

    Returns a summary dict so callers / API endpoints can log / return it.
    """
    # Import here to avoid circular imports at module level
    from ..models.models import Subscription, Member, Plan, User, Notification

    today = date.today()
    target_dates = {today + timedelta(days=d): d for d in ALERT_DAYS}

    # Single query: active subs whose end_date is one of our four targets
    subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.status == "active",
            Subscription.end_date.in_(list(target_dates.keys())),
        )
        .all()
    )

    logger.info(
        f"[ExpiryChecker] {today} — found {len(subscriptions)} "
        f"subscription(s) hitting alert milestones"
    )

    # Fetch all admin users once
    admin_users = db.query(User).filter(User.role == "admin").all()
    if not admin_users:
        logger.warning("[ExpiryChecker] No admin users found — skipping notifications")
        return {"checked": len(subscriptions), "notified": 0, "skipped": 0}

    notified = 0
    skipped = 0

    for sub in subscriptions:
        days_left = target_dates[sub.end_date]
        label = ALERT_DAYS[days_left]

        member = db.query(Member).filter(Member.id == sub.member_id).first()
        plan   = db.query(Plan).filter(Plan.id == sub.plan_id).first()

        member_name = member.user.name if (member and member.user) else f"Member #{sub.member_id}"
        plan_name   = plan.name if plan else "Unknown Plan"

        # Build unique tag so we can de-duplicate within the same day
        dedup_title_fragment = f"[EXPIRY-{sub.id}-D{days_left}]"

        # Has any admin already received this exact alert today?
        already_sent = (
            db.query(Notification)
            .filter(
                Notification.user_id == admin_users[0].id,
                Notification.title.contains(dedup_title_fragment),
                Notification.created_at >= datetime.combine(today, datetime.min.time()),
            )
            .first()
        )

        if already_sent:
            logger.debug(
                f"[ExpiryChecker] Skipping sub #{sub.id} for {member_name} "
                f"— alert already sent today"
            )
            skipped += 1
            continue

        # Compose message
        if days_left == 0:
            title   = f"🔴 Membership Expires TODAY {dedup_title_fragment}"
            message = (
                f"{member_name}'s '{plan_name}' membership expires TODAY "
                f"({sub.end_date.strftime('%d %B %Y')}). "
                f"Please contact the member to arrange renewal."
            )
            notif_type = "error"
        else:
            title   = f"⚠️ Membership Expiring {label.title()} {dedup_title_fragment}"
            message = (
                f"{member_name}'s '{plan_name}' membership expires {label} "
                f"({sub.end_date.strftime('%d %B %Y')}). "
                f"Consider reaching out to encourage renewal."
            )
            notif_type = "warning"

        # Create one notification per admin user
        for admin in admin_users:
            notification = Notification(
                user_id=admin.id,
                title=title,
                message=message,
                type=notif_type,
                is_read=False,
            )
            db.add(notification)

        notified += 1
        logger.info(
            f"[ExpiryChecker] Notified {len(admin_users)} admin(s) about "
            f"sub #{sub.id} ({member_name}) expiring {label}"
        )

    db.commit()

    summary = {
        "date": today.isoformat(),
        "subscriptions_checked": len(subscriptions),
        "alerts_sent": notified,
        "alerts_skipped_duplicate": skipped,
        "admins_notified": len(admin_users),
    }
    logger.info(f"[ExpiryChecker] Done — {summary}")
    return summary


# ------------------------------------------------------------------ #
#  Daily background scheduler                                          #
# ------------------------------------------------------------------ #

def _scheduler_loop(get_db_func, run_hour: int = 8):
    """
    Infinite loop that fires check_subscription_expiries() once per day
    at `run_hour` (24 h, server-local time).  Runs in a daemon thread so
    it stops automatically when the main process exits.
    """
    logger.info(
        f"[ExpiryChecker] Scheduler started — will run daily at {run_hour:02d}:00"
    )

    while True:
        now = datetime.now()
        # Calculate seconds until next run_hour today (or tomorrow if past)
        next_run = now.replace(hour=run_hour, minute=0, second=0, microsecond=0)
        if now >= next_run:
            next_run += timedelta(days=1)

        sleep_seconds = (next_run - now).total_seconds()
        logger.info(
            f"[ExpiryChecker] Next check at {next_run.strftime('%Y-%m-%d %H:%M:%S')} "
            f"(in {sleep_seconds / 3600:.1f} h)"
        )
        time.sleep(sleep_seconds)

        # Run the job inside a fresh DB session
        db: Session = next(get_db_func())
        try:
            check_subscription_expiries(db)
        except Exception as exc:
            logger.exception(f"[ExpiryChecker] Job failed: {exc}")
        finally:
            db.close()


def start_expiry_scheduler(get_db_func, run_hour: int = 8):
    """
    Spawn the daily scheduler as a daemon thread.
    Call this once from your FastAPI lifespan / startup event.

    Also fires an *immediate* check on startup (with a 5-second delay
    so the DB connection pool is ready) — useful on first deploy.
    """
    def _startup_check():
        time.sleep(5)  # wait for the app to finish initialising
        db: Session = next(get_db_func())
        try:
            logger.info("[ExpiryChecker] Running startup check …")
            check_subscription_expiries(db)
        except Exception as exc:
            logger.exception(f"[ExpiryChecker] Startup check failed: {exc}")
        finally:
            db.close()

    # Immediate check thread
    t_startup = threading.Thread(target=_startup_check, daemon=True, name="ExpiryStartup")
    t_startup.start()

    # Daily recurring thread
    t_daily = threading.Thread(
        target=_scheduler_loop,
        args=(get_db_func, run_hour),
        daemon=True,
        name="ExpiryScheduler",
    )
    t_daily.start()

    logger.info("[ExpiryChecker] Scheduler threads launched")