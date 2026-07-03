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
def get_dashboard_stats(db: Session = Depends(get_db), admin=Depends(require_admin)):
    today = date.today()
    first_day_of_month = date(today.year, today.month, 1)
    
    total_members = db.query(Member).count()
    active_subscriptions = db.query(Subscription).filter(Subscription.status == "active").count()
    expired_subscriptions = db.query(Subscription).filter(Subscription.status == "expired").count()
    
    monthly_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.status == "paid",
        func.date(Payment.payment_date) >= first_day_of_month
    ).scalar() or 0
    
    new_registrations = db.query(Member).join(User).filter(
        func.date(User.created_at) >= first_day_of_month
    ).count()
    
    todays_attendance = db.query(Attendance).filter(
        func.date(Attendance.check_in_time) == today
    ).count()
    
    return DashboardStats(
        total_members=total_members,
        active_subscriptions=active_subscriptions,
        expired_subscriptions=expired_subscriptions,
        monthly_revenue=float(monthly_revenue),
        new_registrations_this_month=new_registrations,
        todays_attendance=todays_attendance
    )