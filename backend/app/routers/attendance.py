# backend/app/routers/attendance.py - GYM SCOPED

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta
import threading
from collections import defaultdict
from ..database import get_db
from ..models.models import Attendance, Member, User
from ..schemas.schemas import AttendanceCreate, AttendanceOut, MemberOut, UserOut
from ..utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

_checkin_locks = defaultdict(threading.Lock)
_checkin_locks_guard = threading.Lock()

def _get_member_lock(member_id: int) -> threading.Lock:
    with _checkin_locks_guard:
        return _checkin_locks[member_id]

# ============================================================
# ADMIN ENDPOINTS - gym scoped
# ============================================================

@router.get("/", response_model=List[AttendanceOut])
def get_attendance(
    date_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get attendance records for the admin's own gym, optional date filter"""
    query = (
        db.query(Attendance)
        .join(Member, Attendance.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .options(joinedload(Attendance.member).joinedload(Member.user))
        .filter(User.gym_id == admin.gym_id)
    )
    if date_filter:
        try:
            d = date.fromisoformat(date_filter)
            query = query.filter(func.date(Attendance.check_in_time) == d)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    return query.order_by(Attendance.check_in_time.desc()).all()


@router.post("/", response_model=AttendanceOut)
def check_in(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Check in a specific member (must belong to the admin's gym)"""
    member = (
        db.query(Member)
        .join(User, Member.user_id == User.id)
        .filter(Member.id == data.member_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    with _get_member_lock(data.member_id):
        today = date.today()
        existing = db.query(Attendance).filter(
            Attendance.member_id == data.member_id,
            func.date(Attendance.check_in_time) == today
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Member already checked in today")

        record = Attendance(member_id=data.member_id)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Delete an attendance record (must belong to the admin's gym)"""
    record = (
        db.query(Attendance)
        .join(Member, Attendance.member_id == Member.id)
        .join(User, Member.user_id == User.id)
        .filter(Attendance.id == attendance_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    return {"message": "Deleted"}


# ============================================================
# MEMBER ENDPOINTS - unchanged, already correctly scoped
# ============================================================

@router.get("/my", response_model=List[AttendanceOut])
def my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return []
    return db.query(Attendance).options(
        joinedload(Attendance.member).joinedload(Member.user)
    ).filter(
        Attendance.member_id == member.id
    ).order_by(Attendance.check_in_time.desc()).all()


@router.get("/my/stats")
def my_attendance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"total": 0, "this_month": 0, "streak": 0, "today": False}

    records = db.query(Attendance).filter(Attendance.member_id == member.id).all()
    today = datetime.now().date()
    checked_in_today = any(r.check_in_time.date() == today for r in records)

    streak = 0
    if records:
        checkin_dates = {r.check_in_time.date() for r in records}
        current_date = today
        while current_date in checkin_dates:
            streak += 1
            current_date -= timedelta(days=1)

    return {
        "total": len(records),
        "this_month": sum(
            1 for r in records
            if r.check_in_time.month == today.month and r.check_in_time.year == today.year
        ),
        "streak": streak,
        "today": checked_in_today
    }


@router.post("/my-checkin")
def my_check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")

    with _get_member_lock(member.id):
        today = date.today()
        existing = db.query(Attendance).filter(
            Attendance.member_id == member.id,
            func.date(Attendance.check_in_time) == today
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Already checked in today")

        record = Attendance(member_id=member.id)
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "message": "Checked in successfully! 💪",
            "check_in_time": record.check_in_time.isoformat(),
            "member_id": member.id
        }


@router.get("/check-today")
def check_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"checked_in": False, "check_in_time": None}

    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.member_id == member.id,
        func.date(Attendance.check_in_time) == today
    ).first()

    return {
        "checked_in": record is not None,
        "check_in_time": record.check_in_time.isoformat() if record else None
    }