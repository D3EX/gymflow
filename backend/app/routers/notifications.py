# backend/app/routers/notifications.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta
from ..database import get_db
from ..models.models import Notification, Member, User, Payment, Subscription, Plan
from ..schemas.schemas import NotificationCreate, NotificationOut
from ..utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


# ============================================================
# DEBUG ENDPOINT - TEST NOTIFICATION CREATION
# ============================================================

@router.post("/test")
def test_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    TEST: Create a test notification for the current user
    This helps debug if notifications are working
    """
    print(f"TEST: Creating test notification for user {current_user.id}")
    
    # Get member profile
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        print(f"No member profile found for user {current_user.id}")
        return {"error": "No member profile found"}
    
    print(f"Member found: ID {member.id}, Name: {member.user.name}")
    
    # Create test notification
    notification = Notification(
        member_id=member.id,
        title="Test Notification",
        message=f"Hello {member.user.name}! This is a test notification created at {datetime.now().strftime('%H:%M:%S')}",
        type="info"
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    print(f"Test notification created: ID {notification.id}")
    
    return {
        "success": True,
        "notification_id": notification.id,
        "message": "Test notification created successfully",
        "notification": {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "created_at": notification.created_at.isoformat()
        }
    }


# ============================================================
# DEBUG ENDPOINT - CHECK DATABASE
# ============================================================

@router.get("/debug")
def debug_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    DEBUG: Check notification system status
    """
    print(f"DEBUG: Checking notification system for user {current_user.id}")
    
    # Get member
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    
    result = {
        "user_id": current_user.id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "has_member_profile": member is not None,
    }
    
    if member:
        result["member_id"] = member.id
        
        # Get all notifications for this member
        notifications = db.query(Notification).filter(
            Notification.member_id == member.id
        ).order_by(Notification.created_at.desc()).all()
        
        result["notification_count"] = len(notifications)
        result["unread_count"] = sum(1 for n in notifications if not n.is_read)
        result["notifications"] = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message[:50] + "..." if len(n.message) > 50 else n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications[:10]
        ]
        
        total_all = db.query(Notification).count()
        result["total_notifications_in_db"] = total_all
        members_with_notifications = db.query(Notification.member_id).distinct().count()
        result["members_with_notifications"] = members_with_notifications
        
    else:
        result["error"] = "No member profile found"
    
    print(f"DEBUG Result: {result}")
    return result


# ============================================================
# ADMIN ENDPOINTS
# ============================================================

@router.get("/", response_model=List[NotificationOut])
def get_notifications(
    is_read: Optional[bool] = None,
    member_id: Optional[int] = None,
    type: Optional[str] = None,
    limit: Optional[int] = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get all notifications for the admin's gym"""
    print(f"ADMIN: Fetching notifications for gym {admin.gym_id}")
    
    # Base query: notifications for members in the admin's gym
    query = (
        db.query(Notification)
        .join(Member, Notification.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
    )
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if member_id is not None:
        # Verify the member belongs to the admin's gym
        member = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == member_id, User.gym_id == admin.gym_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found in your gym")
        query = query.filter(Notification.member_id == member_id)
    if type is not None:
        query = query.filter(Notification.type == type)
    
    result = query.order_by(Notification.created_at.desc()).limit(limit).all()
    print(f"Found {len(result)} notifications")
    return result


@router.get("/stats")
def get_notification_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get notification statistics for the admin's gym"""
    # Base query for admin's gym
    base = (
        db.query(Notification)
        .join(Member, Notification.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
    )
    
    total = base.count()
    unread = base.filter(Notification.is_read == False).count()
    
    types = (
        db.query(Notification.type, func.count(Notification.id))
        .join(Member, Notification.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
        .group_by(Notification.type)
        .all()
    )
    
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent = base.filter(Notification.created_at >= week_ago).count()
    
    return {
        "total": total,
        "unread": unread,
        "read": total - unread,
        "by_type": [{"type": t[0], "count": t[1]} for t in types],
        "recent_7_days": recent
    }


@router.get("/my", response_model=List[NotificationOut])
def my_notifications(
    is_read: Optional[bool] = None,
    limit: Optional[int] = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ADMIN, MANAGER, OR COACH: notifications stored by user_id
    if current_user.role in ("admin", "manager", "coach"):
        query = db.query(Notification).filter(
            Notification.user_id == current_user.id
        )
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        return query.order_by(Notification.created_at.desc()).limit(limit).all()

    # Client/member: notifications stored by member_id
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return []
    query = db.query(Notification).filter(Notification.member_id == member.id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    return query.order_by(Notification.created_at.desc()).limit(limit).all()


@router.get("/my/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ADMIN, MANAGER, OR COACH
    if current_user.role in ("admin", "manager", "coach"):
        count = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()
        return {"unread_count": count}

    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"unread_count": 0}
    count = db.query(Notification).filter(
        Notification.member_id == member.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.put("/my/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ADMIN, MANAGER, OR COACH
    if current_user.role in ("admin", "manager", "coach"):
        db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return {"message": "All notifications marked as read"}

    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.query(Notification).filter(
        Notification.member_id == member.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.put("/my/{notification_id}/read")
def mark_my_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # ADMIN, MANAGER, OR COACH
    if current_user.role in ("admin", "manager", "coach"):
        if notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        notification.is_read = True
        db.commit()
        return {"message": "Notification marked as read"}

    # Member
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if notification.member_id != member.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}


@router.post("/", response_model=NotificationOut)
def create_notification(
    data: NotificationCreate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """ADMIN: Create a notification for a member in the admin's gym"""
    print(f"ADMIN: Creating notification for member {data.member_id}")
    
    # Verify member belongs to admin's gym
    member = db.query(Member).join(User, Member.user_id == User.id).filter(
        Member.id == data.member_id,
        User.gym_id == admin.gym_id
    ).first()
    if not member:
        print(f"Member {data.member_id} not found in admin's gym")
        raise HTTPException(status_code=404, detail="Member not found")
    
    print(f"Member found: {member.user.name}")
    
    notification = Notification(**data.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    print(f"Notification created: ID {notification.id}")
    return notification


@router.post("/bulk")
def create_bulk_notifications(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Send notification to multiple members in the admin's gym"""
    member_ids = data.get("member_ids", [])
    title = data.get("title", "Notification")
    message = data.get("message", "")
    notification_type = data.get("type", "info")
    
    if not member_ids:
        raise HTTPException(status_code=400, detail="No member IDs provided")
    
    created_count = 0
    for member_id in member_ids:
        # Verify each member belongs to admin's gym
        member = db.query(Member).join(User, Member.user_id == User.id).filter(
            Member.id == member_id,
            User.gym_id == admin.gym_id
        ).first()
        if member:
            notification = Notification(
                member_id=member_id,
                title=title,
                message=message,
                type=notification_type
            )
            db.add(notification)
            created_count += 1
    
    db.commit()
    
    return {
        "message": f"Notifications sent to {created_count} members",
        "sent_count": created_count,
        "total_requested": len(member_ids)
    }


@router.post("/send-to-all")
def send_to_all_members(
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Send notification to ALL members in the admin's gym"""
    title = data.get("title", "Notification")
    message = data.get("message", "")
    notification_type = data.get("type", "info")
    filter_status = data.get("status", None)
    
    # Query members in the admin's gym
    query = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
    )
    if filter_status:
        query = query.filter(Member.status == filter_status)
    
    members = query.all()
    
    created_count = 0
    for member in members:
        notification = Notification(
            member_id=member.id,
            title=title,
            message=message,
            type=notification_type
        )
        db.add(notification)
        created_count += 1
    
    db.commit()
    
    return {
        "message": f"Notifications sent to {created_count} members",
        "sent_count": created_count,
        "filter_status": filter_status
    }


@router.post("/birthday/{member_id}")
def send_birthday_notification(
    member_id: int,
    gift_type: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Send birthday notification to a member in the admin's gym"""
    print(f"Sending birthday notification to member {member_id}")
    
    # Verify member belongs to admin's gym
    member = db.query(Member).join(User, Member.user_id == User.id).filter(
        Member.id == member_id,
        User.gym_id == admin.gym_id
    ).first()
    if not member:
        print(f"Member {member_id} not found in admin's gym")
        raise HTTPException(status_code=404, detail="Member not found")
    
    print(f"Member found: {member.user.name}")
    
    gift_messages = {
        "free_days": "5 free days added to your membership!",
        "supplement": "Free supplement pack waiting for you at the front desk!",
        "discount": "20% discount on your next renewal!",
        "personal_training": "Free personal training session - book now!",
        "gym_merch": "Free gym merchandise - pick up at the front desk!",
        "smoothie": "Free smoothie at our cafe - show this message!"
    }
    
    message = f"Happy Birthday {member.user.name}! "
    if gift_type and gift_type in gift_messages:
        message += gift_messages[gift_type]
    else:
        message += "Wishing you a fantastic day from all of us at GymFlow!"
    
    notification = Notification(
        member_id=member_id,
        title="Happy Birthday",
        message=message,
        type="birthday"
    )
    db.add(notification)
    db.commit()
    
    print(f"Birthday notification created: ID {notification.id}")
    
    return {"message": "Birthday notification sent", "gift": gift_type}


# ============================================================
# SYNC HISTORICAL PAYMENTS - CREATE NOTIFICATIONS FOR OLD PAYMENTS
# ============================================================

@router.post("/sync-payments")
def sync_payment_notifications(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN: Create notifications for payments in the admin's gym
    """
    print("Starting payment notification sync...")
    
    # Get payments for members in the admin's gym
    payments = (
        db.query(Payment)
        .join(Member, Payment.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
        .all()
    )
    print(f"Found {len(payments)} total payments in gym {admin.gym_id}")
    
    created_count = 0
    skipped_count = 0
    
    for payment in payments:
        existing = db.query(Notification).filter(
            Notification.member_id == payment.member_id,
            Notification.title.like("%Payment%"),
            Notification.message.like(f"%{payment.amount}%")
        ).first()
        
        if existing:
            skipped_count += 1
            continue
        
        status_messages = {
            "paid": "Your payment has been confirmed.",
            "pending": "Your payment is being processed.",
            "overdue": "Your payment is overdue. Please contact support."
        }
        
        notification = Notification(
            member_id=payment.member_id,
            title=f"Payment {payment.status.title()}",
            message=f"Amount: {payment.amount:,.0f} DZD. {status_messages.get(payment.status, '')}",
            type="success" if payment.status == "paid" else "warning" if payment.status == "overdue" else "info",
            is_read=True
        )
        db.add(notification)
        created_count += 1
    
    db.commit()
    
    print(f"Created {created_count} notifications for payments in gym {admin.gym_id}")
    print(f"Skipped {skipped_count} existing notifications")
    
    return {
        "message": f"Created {created_count} notifications for payments",
        "created": created_count,
        "skipped": skipped_count,
        "total_payments": len(payments)
    }


@router.post("/my/sync-payments")
def sync_my_payment_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Create notifications for all their own payments
    """
    print(f"Syncing payment notifications for user {current_user.id}")
    
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    payments = db.query(Payment).filter(Payment.member_id == member.id).all()
    print(f"Found {len(payments)} payments for member {member.id}")
    
    created_count = 0
    skipped_count = 0
    
    for payment in payments:
        existing = db.query(Notification).filter(
            Notification.member_id == member.id,
            Notification.message.like(f"%{payment.amount}%"),
            Notification.created_at >= payment.created_at - timedelta(days=1)
        ).first()
        
        if existing:
            skipped_count += 1
            continue
        
        status_messages = {
            "paid": "Payment confirmed.",
            "pending": "Payment being processed.",
            "overdue": "Payment overdue. Contact support."
        }
        
        notification = Notification(
            member_id=member.id,
            title=f"Payment {payment.status.title()}",
            message=f"Amount: {payment.amount:,.0f} DZD. {status_messages.get(payment.status, '')}",
            type="success" if payment.status == "paid" else "warning" if payment.status == "overdue" else "info",
            is_read=True
        )
        db.add(notification)
        created_count += 1
    
    db.commit()
    
    print(f"Created {created_count} notifications for member {member.id}")
    print(f"Skipped {skipped_count} existing notifications")
    
    return {
        "message": f"Created {created_count} payment notifications",
        "created": created_count,
        "skipped": skipped_count,
        "total_payments": len(payments)
    }


@router.post("/sync-all-history")
def sync_all_historical_notifications(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN: Create notifications for ALL historical data in the admin's gym
    """
    print("Starting full historical sync...")
    
    results = {
        "payments": {"created": 0, "skipped": 0},
        "subscriptions": {"created": 0, "skipped": 0},
    }
    
    # 1. Sync Payments in admin's gym
    payments = (
        db.query(Payment)
        .join(Member, Payment.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
        .all()
    )
    print(f"Found {len(payments)} payments in gym {admin.gym_id}")
    
    for payment in payments:
        existing = db.query(Notification).filter(
            Notification.member_id == payment.member_id,
            Notification.title.like("%Payment%"),
            Notification.message.like(f"%{payment.amount}%")
        ).first()
        
        if existing:
            results["payments"]["skipped"] += 1
            continue
        
        notification = Notification(
            member_id=payment.member_id,
            title=f"Payment {payment.status.title()}",
            message=f"Amount: {payment.amount:,.0f} DZD. Payment recorded on {payment.created_at.strftime('%d %B %Y')}.",
            type="success" if payment.status == "paid" else "warning" if payment.status == "overdue" else "info",
            is_read=True
        )
        db.add(notification)
        results["payments"]["created"] += 1
    
    # 2. Sync Subscriptions in admin's gym
    subscriptions = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
        .all()
    )
    print(f"Found {len(subscriptions)} subscriptions in gym {admin.gym_id}")
    
    for sub in subscriptions:
        existing = db.query(Notification).filter(
            Notification.member_id == sub.member_id,
            Notification.title.like("%Membership%"),
            Notification.created_at >= sub.created_at - timedelta(days=1)
        ).first()
        
        if existing:
            results["subscriptions"]["skipped"] += 1
            continue
        
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        plan_name = plan.name if plan else "Membership"
        
        notification = Notification(
            member_id=sub.member_id,
            title=f"Membership {sub.status.title()}",
            message=f"Plan: {plan_name}. Valid from {sub.start_date.strftime('%d %B %Y')} to {sub.end_date.strftime('%d %B %Y')}.",
            type="success" if sub.status == "active" else "warning" if sub.status == "expired" else "info",
            is_read=True
        )
        db.add(notification)
        results["subscriptions"]["created"] += 1
    
    db.commit()
    
    print(f"Created {results['payments']['created']} payment notifications")
    print(f"Created {results['subscriptions']['created']} subscription notifications")
    
    return {
        "message": "Historical notifications synced successfully",
        "results": results,
        "total_created": results["payments"]["created"] + results["subscriptions"]["created"]
    }


# ============================================================
# UPDATE NOTIFICATION (ADMIN)
# ============================================================

@router.put("/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Update a notification (must belong to admin's gym)"""
    # Verify notification belongs to a member in the admin's gym
    notification = (
        db.query(Notification)
        .join(Member, Notification.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            Notification.id == notification_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if "title" in data:
        notification.title = data["title"]
    if "message" in data:
        notification.message = data["message"]
    if "type" in data:
        notification.type = data["type"]
    if "is_read" in data:
        notification.is_read = data["is_read"]
    
    db.commit()
    db.refresh(notification)
    return notification


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """ADMIN: Delete a notification (must belong to admin's gym)"""
    print(f"Deleting notification {notification_id}")
    
    # Verify notification belongs to a member in the admin's gym
    notification = (
        db.query(Notification)
        .join(Member, Notification.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            Notification.id == notification_id,
            User.gym_id == admin.gym_id
        )
    ).first()
    
    if not notification:
        print(f"Notification {notification_id} not found in admin's gym")
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    print(f"Notification {notification_id} deleted")
    return {"message": "Notification deleted"}


@router.delete("/member/{member_id}/all")
def delete_member_notifications(
    member_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Delete all notifications for a member in the admin's gym"""
    # Verify member belongs to admin's gym
    member = db.query(Member).join(User, Member.user_id == User.id).filter(
        Member.id == member_id,
        User.gym_id == admin.gym_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    deleted = db.query(Notification).filter(
        Notification.member_id == member_id
    ).delete()
    
    db.commit()
    
    return {"message": f"Deleted {deleted} notifications for member {member_id}"}


# ============================================================
# SYSTEM ENDPOINTS - AUTO GENERATED NOTIFICATIONS
# ============================================================

@router.post("/system/expiring-soon")
def notify_expiring_memberships(
    days: int = 7,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Send notifications to members in the admin's gym whose memberships are expiring soon"""
    today = date.today()
    target_date = today + timedelta(days=days)
    
    # Get expiring subscriptions for members in the admin's gym
    expiring_subs = (
        db.query(Subscription)
        .join(Member, Subscription.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(
            User.gym_id == admin.gym_id,
            Subscription.status == "active",
            Subscription.end_date <= target_date,
            Subscription.end_date >= today
        )
        .all()
    )
    
    sent_count = 0
    for sub in expiring_subs:
        existing = db.query(Notification).filter(
            Notification.member_id == sub.member_id,
            Notification.title.like("%Expiring%"),
            Notification.created_at >= datetime.utcnow() - timedelta(days=7)
        ).first()
        
        if not existing:
            days_left = (sub.end_date - today).days
            notification = Notification(
                member_id=sub.member_id,
                title="Membership Expiring Soon",
                message=f"Your membership expires in {days_left} days ({sub.end_date.strftime('%d %B %Y')}). Please renew to keep your access.",
                type="warning"
            )
            db.add(notification)
            sent_count += 1
    
    db.commit()
    
    return {
        "message": f"Sent {sent_count} expiry notifications",
        "expiring_count": len(expiring_subs),
        "sent_count": sent_count
    }


# ============================================================
# HELPER FUNCTIONS (for use in other modules)
# ============================================================

def create_notification_helper(
    db: Session,
    member_id: int,
    title: str,
    message: str,
    notification_type: str = "info"
):
    """
    Helper function to create notifications from other modules
    """
    print(f"Helper: Creating notification for member {member_id}")
    
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        print(f"Member {member_id} not found")
        return None
    
    notification = Notification(
        member_id=member_id,
        title=title,
        message=message,
        type=notification_type
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    print(f"Notification created: ID {notification.id}")
    return notification


def notify_payment_created(db: Session, member_id: int, amount: float, status: str = "pending"):
    """Helper: Create notification when a payment is created"""
    notification = Notification(
        member_id=member_id,
        title="Payment Recorded",
        message=f"Your payment of {amount:,.0f} DZD has been recorded. Status: {status}",
        type="info"
    )
    db.add(notification)
    db.commit()
    return notification


def notify_payment_confirmed(db: Session, member_id: int, amount: float):
    """Helper: Create notification when a payment is confirmed"""
    notification = Notification(
        member_id=member_id,
        title="Payment Confirmed",
        message=f"Your payment of {amount:,.0f} DZD has been confirmed. Thank you!",
        type="success"
    )
    db.add(notification)
    db.commit()
    return notification


def notify_subscription_created(db: Session, member_id: int, plan_name: str, end_date):
    """Helper: Create notification when a subscription is created"""
    notification = Notification(
        member_id=member_id,
        title="Membership Activated",
        message=f"Your '{plan_name}' membership is active until {end_date.strftime('%d %B %Y')}.",
        type="success"
    )
    db.add(notification)
    db.commit()
    return notification


# ============================================================
# ADMIN ALERT HELPERS
# ============================================================

def get_admin_member_ids(db: Session, gym_id: int) -> List[int]:
    """
    Helper: Find the member_id(s) belonging to admin users in the given gym
    """
    admin_users = db.query(User).filter(User.role == "admin", User.gym_id == gym_id).all()
    admin_user_ids = [u.id for u in admin_users]

    if not admin_user_ids:
        return []

    admin_members = db.query(Member).filter(
        Member.user_id.in_(admin_user_ids)
    ).all()

    return [m.id for m in admin_members]


def notify_admins(db: Session, title: str, message: str, gym_id: int, notification_type: str = "info"):
    """
    Send notification to admin users in the given gym only.
    `gym_id` is required — callers must always know which gym the
    triggering event belongs to (the member/payment/subscription's
    owning gym), so there's no "system-wide" fallback here.
    """
    admin_users = db.query(User).filter(User.role == "admin", User.gym_id == gym_id).all()
    
    print(f"\nNOTIFY_ADMINS CALLED")
    print(f"  Title: {title}")
    print(f"  Message: {message[:50]}...")
    print(f"  Type: {notification_type}")
    print(f"  Gym: {gym_id}")
    print(f"  Admin users found: {len(admin_users)}")
    
    if not admin_users:
        print(f"No admin users found for gym {gym_id}")
        return []
    
    created = []
    for admin in admin_users:
        print(f"  Creating notification for admin: {admin.name} (ID: {admin.id})")
        
        notification = Notification(
            user_id=admin.id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False
        )
        db.add(notification)
        created.append(notification)
    
    db.commit()
    print(f"Created {len(created)} admin notifications")
    
    return created


def notify_admins_new_signup(db: Session, member_name: str, gym_id: int, plan_name: str = None, pending_approval: bool = False):
    """Alert admins of the given gym when a new member signs up there."""
    plan_part = f" ({plan_name})" if plan_name else ""
    
    if pending_approval:
        return notify_admins(
            db,
            title="New Signup - Approval Needed",
            message=f"{member_name} just registered{plan_part} and is awaiting your approval.",
            gym_id=gym_id,
            notification_type="warning"
        )
    else:
        return notify_admins(
            db,
            title="New Member Signup",
            message=f"{member_name} just joined the gym{plan_part}.",
            gym_id=gym_id,
            notification_type="success"
        )


def notify_admins_payment_issue(db: Session, member_name: str, amount: float, status: str, gym_id: int):
    """Helper: Alert admins of the given gym when a payment fails or becomes overdue"""
    status_label = "failed" if status == "failed" else "is overdue"
    return notify_admins(
        db,
        title="Payment Issue",
        message=f"{member_name}'s payment of {amount:,.0f} DZD {status_label}.",
        gym_id=gym_id,
        notification_type="warning"
    )


def notify_admins_subscription_expiring(
    db: Session,
    member_name: str,
    plan_name: str,
    end_date,
    days_left: int,
    gym_id: int,
):
    """
    Helper: Alert admins of the given gym about an upcoming subscription expiry.
    """
    labels = {3: "in 3 days", 2: "in 2 days", 1: "tomorrow", 0: "TODAY"}
    label = labels.get(days_left, f"in {days_left} days")

    if days_left == 0:
        title = "Membership Expires TODAY"
        message = (
            f"{member_name}'s '{plan_name}' membership expires TODAY "
            f"({end_date.strftime('%d %B %Y')}). "
            f"Please contact the member to arrange renewal."
        )
        notif_type = "error"
    else:
        title = f"Membership Expiring {label.title()}"
        message = (
            f"{member_name}'s '{plan_name}' membership expires {label} "
            f"({end_date.strftime('%d %B %Y')}). "
            f"Consider reaching out to encourage renewal."
        )
        notif_type = "warning"

    return notify_admins(db, title=title, message=message, gym_id=gym_id, notification_type=notif_type)


# ============================================================
# SUBSCRIPTION EXPIRY ALERTS - ADMIN TRIGGER
# ============================================================

@router.post("/system/check-expiry")
def trigger_expiry_check(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN: Manually trigger the subscription expiry checker for the admin's gym.
    """
    # Since we don't have the actual expiry checker function, this is a placeholder
    # that runs the same logic as /system/expiring-soon but for the admin's gym.
    return notify_expiring_memberships(days=7, db=db, admin=admin)


@router.post("/test-coach")
def test_coach_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """TEST: Create a test notification for coaches/admins"""
    if current_user.role not in ("admin", "coach", "manager"):
        raise HTTPException(status_code=403, detail="Only coaches and admins can use this")
    
    notification = Notification(
        user_id=current_user.id,
        title="Test Coach Notification",
        message=f"Hello {current_user.name}! This is a test notification for coaches at {datetime.now().strftime('%H:%M:%S')}",
        type="info",
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {
        "success": True,
        "notification_id": notification.id,
        "message": "Test coach notification created"
    }