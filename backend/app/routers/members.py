# backend/app/routers/members.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models.models import User, Member, Attendance, Subscription, Plan, Gym
from ..schemas.schemas import MemberCreate, MemberUpdate, MemberOut
from ..utils.auth import require_admin, hash_password, get_current_user
from ..tiers import get_tier_limits
from .notifications import notify_admins_new_signup

router = APIRouter(prefix="/api/members", tags=["Members"])


# ============================================================
# ADMIN: LIST (gym-scoped)
# ============================================================

@router.get("/", response_model=List[MemberOut])
def get_members(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
        .all()
    )


# ============================================================
# MEMBER: SELF-SERVICE (literal "/my*" paths before "/{member_id}")
# ============================================================

@router.get("/my", response_model=MemberOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's member profile with all calculated data"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")

    attendance_records = db.query(Attendance).filter(
        Attendance.member_id == member.id
    ).all()

    total_checkins = len(attendance_records)

    current_month = datetime.now().month
    current_year = datetime.now().year
    checkins_this_month = sum(
        1 for a in attendance_records
        if a.check_in_time.month == current_month and
           a.check_in_time.year == current_year
    )

    streak = 0
    if attendance_records:
        today = datetime.now().date()
        checkin_dates = set()
        for a in attendance_records:
            checkin_dates.add(a.check_in_time.date())

        current_date = today
        while current_date in checkin_dates:
            streak += 1
            current_date -= timedelta(days=1)

    active_sub = db.query(Subscription).filter(
        Subscription.member_id == member.id,
        Subscription.status == "active"
    ).order_by(Subscription.end_date.desc()).first()

    if not active_sub:
        active_sub = db.query(Subscription).filter(
            Subscription.member_id == member.id
        ).order_by(Subscription.end_date.desc()).first()

    membership_info = None
    days_left = 0
    is_active = False

    if active_sub:
        plan = db.query(Plan).filter(Plan.id == active_sub.plan_id).first()

        end_date = active_sub.end_date
        today = datetime.now().date()
        days_left = (end_date - today).days if end_date else 0

        is_active = active_sub.status == "active" and days_left > 0

        membership_info = {
            "plan": {
                "id": plan.id if plan else None,
                "name": plan.name if plan else "Basic",
                "price": plan.price if plan else 0,
                "description": plan.description if plan else None,
                "duration_days": plan.duration_days if plan else 30
            },
            "start_date": active_sub.start_date.isoformat() if active_sub.start_date else None,
            "end_date": active_sub.end_date.isoformat() if active_sub.end_date else None,
            "status": "active" if is_active else "expired"
        }

    return {
        "id": member.id,
        "user_id": member.user_id,
        "phone": member.phone,
        "age": member.age,
        "weight": member.weight,
        "height": member.height,
        "gender": member.gender,
        "status": member.status,
        "date_of_birth": member.date_of_birth,
        "created_at": member.created_at,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "created_at": current_user.created_at
        },
        "total_checkins": total_checkins,
        "checkins_this_month": checkins_this_month,
        "streak": streak,
        "days_left": days_left if is_active else 0,
        "membership": membership_info
    }


@router.put("/my", response_model=MemberOut)
def update_my_profile(
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Update current user's own profile (no admin required)"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")

    if data.name is not None:
        member.user.name = data.name

    for field in ["phone", "age", "weight", "height", "gender", "date_of_birth"]:
        val = getattr(data, field)
        if val is not None:
            setattr(member, field, val)

    db.commit()
    db.refresh(member)

    attendance_count = db.query(Attendance).filter(
        Attendance.member_id == member.id
    ).count()

    return {
        "id": member.id,
        "user_id": member.user_id,
        "phone": member.phone,
        "age": member.age,
        "weight": member.weight,
        "height": member.height,
        "gender": member.gender,
        "status": member.status,
        "date_of_birth": member.date_of_birth,
        "created_at": member.created_at,
        "user": {
            "id": member.user.id,
            "name": member.user.name,
            "email": member.user.email,
            "role": member.user.role,
            "created_at": member.user.created_at
        },
        "total_checkins": attendance_count,
        "streak": 0,
        "membership": None
    }


# ============================================================
# ADMIN: SINGLE MEMBER, CREATE, UPDATE, DELETE (gym-scoped)
# ============================================================

@router.get("/{member_id}", response_model=MemberOut)
def get_member(member_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    member = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(Member.id == member_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    attendance_records = db.query(Attendance).filter(
        Attendance.member_id == member.id
    ).all()

    total_checkins = len(attendance_records)

    streak = 0
    if attendance_records:
        today = datetime.now().date()
        checkin_dates = set()
        for a in attendance_records:
            checkin_dates.add(a.check_in_time.date())

        current_date = today
        while current_date in checkin_dates:
            streak += 1
            current_date -= timedelta(days=1)

    active_sub = db.query(Subscription).filter(
        Subscription.member_id == member.id,
        Subscription.status == "active"
    ).order_by(Subscription.end_date.desc()).first()

    membership_info = None
    if active_sub:
        plan = db.query(Plan).filter(Plan.id == active_sub.plan_id).first()
        membership_info = {
            "plan": {
                "name": plan.name if plan else "Basic",
                "price": plan.price if plan else 0
            },
            "start_date": active_sub.start_date.isoformat() if active_sub.start_date else None,
            "end_date": active_sub.end_date.isoformat() if active_sub.end_date else None,
            "status": active_sub.status
        }

    return {
        "id": member.id,
        "user_id": member.user_id,
        "phone": member.phone,
        "age": member.age,
        "weight": member.weight,
        "height": member.height,
        "gender": member.gender,
        "status": member.status,
        "date_of_birth": member.date_of_birth,
        "created_at": member.created_at,
        "user": {
            "id": member.user.id,
            "name": member.user.name,
            "email": member.user.email,
            "role": member.user.role,
            "created_at": member.user.created_at
        },
        "total_checkins": total_checkins,
        "streak": streak,
        "membership": membership_info
    }


@router.post("/", response_model=MemberOut)
def create_member(data: MemberCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    gym = db.query(Gym).filter(Gym.id == admin.gym_id).first()
    if not gym:
        raise HTTPException(status_code=400, detail="Admin is not associated with a gym")

    limits = get_tier_limits(gym.subscription_tier)
    current_member_count = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(User.gym_id == gym.id)
        .count()
    )
    if current_member_count >= limits["max_members"]:
        raise HTTPException(
            status_code=403,
            detail=f"Member limit reached for {gym.subscription_tier} plan "
                   f"({limits['max_members']} max). Upgrade your plan to add more members."
        )

    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="client",
        gym_id=admin.gym_id,
    )
    db.add(user)
    db.flush()

    member = Member(
        user_id=user.id,
        phone=data.phone,
        age=data.age,
        weight=data.weight,
        height=data.height,
        gender=data.gender,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    notify_admins_new_signup(db, member_name=user.name, gym_id=admin.gym_id)

    return {
        "id": member.id,
        "user_id": member.user_id,
        "phone": member.phone,
        "age": member.age,
        "weight": member.weight,
        "height": member.height,
        "gender": member.gender,
        "status": member.status,
        "date_of_birth": member.date_of_birth,
        "created_at": member.created_at,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        },
        "total_checkins": 0,
        "streak": 0,
        "membership": None
    }


@router.put("/{member_id}", response_model=MemberOut)
def update_member(member_id: int, data: MemberUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    member = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(Member.id == member_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if data.name is not None:
        member.user.name = data.name

    for field in ["phone", "age", "weight", "height", "gender", "status", "date_of_birth"]:
        val = getattr(data, field)
        if val is not None:
            setattr(member, field, val)

    db.commit()
    db.refresh(member)

    attendance_count = db.query(Attendance).filter(
        Attendance.member_id == member.id
    ).count()

    return {
        "id": member.id,
        "user_id": member.user_id,
        "phone": member.phone,
        "age": member.age,
        "weight": member.weight,
        "height": member.height,
        "gender": member.gender,
        "status": member.status,
        "date_of_birth": member.date_of_birth,
        "created_at": member.created_at,
        "user": {
            "id": member.user.id,
            "name": member.user.name,
            "email": member.user.email,
            "role": member.user.role,
            "created_at": member.user.created_at
        },
        "total_checkins": attendance_count,
        "streak": 0,
        "membership": None
    }


@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    member = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(Member.id == member_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    user = member.user
    db.delete(member)
    db.delete(user)
    db.commit()
    return {"message": "Member deleted"}