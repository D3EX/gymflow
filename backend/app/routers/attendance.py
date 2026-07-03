# backend/app/routers/attendance.py - FIXED VERSION

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload  # ✅ ADDED joinedload
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

# ------------------------------------------------------------------
# Per-member lock to close the check-then-insert race condition.
# Without this, two near-simultaneous check-in requests (e.g. from a
# rapid double-click, or a flaky network causing a silent retry) can
# both pass the "already checked in?" SELECT before either commits
# their INSERT, resulting in duplicate attendance records for the
# same day.
#
# NOTE: this only guards a single Uvicorn/Gunicorn *process*. If you
# ever run multiple worker processes, this won't be enough — at that
# point add a DB-level UNIQUE constraint on (member_id, date) instead
# (e.g. a generated/computed "checkin_date" column with a unique index).
# ------------------------------------------------------------------
_checkin_locks = defaultdict(threading.Lock)
_checkin_locks_guard = threading.Lock()

def _get_member_lock(member_id: int) -> threading.Lock:
    with _checkin_locks_guard:
        return _checkin_locks[member_id]

# ============================================================
# ADMIN ENDPOINTS - Keep as they are
# ============================================================

@router.get("/", response_model=List[AttendanceOut])
def get_attendance(
    date_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get all attendance records with optional date filter"""
    query = db.query(Attendance).options(joinedload(Attendance.member).joinedload(Member.user))  # ✅ ADDED eager loading
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
    admin=Depends(require_admin)
):
    """ADMIN: Check in a specific member"""
    member = db.query(Member).filter(Member.id == data.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    with _get_member_lock(data.member_id):
        # Check if member already checked in today
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
    admin=Depends(require_admin)
):
    """ADMIN: Delete an attendance record"""
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    return {"message": "Deleted"}


# ============================================================
# MEMBER ENDPOINTS - Fixed with eager loading
# ============================================================

@router.get("/my", response_model=List[AttendanceOut])
def my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get current user's attendance history"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return []
    
    # ✅ FIXED: Added eager loading of member and user relationships
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
    """
    MEMBER: Get attendance statistics
    Returns: { total, this_month, streak, today }
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"total": 0, "this_month": 0, "streak": 0, "today": False}
    
    records = db.query(Attendance).filter(
        Attendance.member_id == member.id
    ).all()
    
    today = datetime.now().date()
    
    # Check if checked in today
    checked_in_today = any(
        r.check_in_time.date() == today for r in records
    )
    
    # Calculate streak
    streak = 0
    if records:
        checkin_dates = set()
        for r in records:
            checkin_dates.add(r.check_in_time.date())
        
        current_date = today
        while current_date in checkin_dates:
            streak += 1
            current_date -= timedelta(days=1)
    
    return {
        "total": len(records),
        "this_month": sum(
            1 for r in records 
            if r.check_in_time.month == today.month and 
               r.check_in_time.year == today.year
        ),
        "streak": streak,
        "today": checked_in_today
    }


@router.post("/my-checkin")
def my_check_in(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Check themselves in
    Returns: { success, message, check_in_time }
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")

    with _get_member_lock(member.id):
        # Check if already checked in today
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
    """
    MEMBER: Check if checked in today
    Returns: { checked_in: bool, check_in_time: str|null }
    """
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