from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from ..database import get_db
from ..models.models import Member, Subscription, Attendance, Payment, User
from ..schemas.schemas import DashboardStats
from ..utils.auth import require_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    today = date.today()
    first_day_of_month = date(today.year, today.month, 1)
    gym_id = admin.gym_id

    total_members = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == gym_id)
        .count()
    )

    active_subscriptions = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == gym_id, Subscription.status == "active")
        .count()
    )

    expired_subscriptions = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == gym_id, Subscription.status == "expired")
        .count()
    )

    monthly_revenue = (
        db.query(func.sum(Payment.amount))
        .join(Member, Payment.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            User.gym_id == gym_id,
            Payment.status == "paid",
            func.date(Payment.payment_date) >= first_day_of_month,
        )
        .scalar() or 0
    )

    new_registrations = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == gym_id, func.date(User.created_at) >= first_day_of_month)
        .count()
    )

    todays_attendance = (
        db.query(Attendance)
        .join(Member, Attendance.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == gym_id, func.date(Attendance.check_in_time) == today)
        .count()
    )

    return DashboardStats(
        total_members=total_members,
        active_subscriptions=active_subscriptions,
        expired_subscriptions=expired_subscriptions,
        monthly_revenue=float(monthly_revenue),
        new_registrations_this_month=new_registrations,
        todays_attendance=todays_attendance
    )