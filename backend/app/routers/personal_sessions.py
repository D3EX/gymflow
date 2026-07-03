# backend/app/routers/personal_sessions.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
import uuid
from pydantic import BaseModel, Field
from ..database import get_db
from ..models.models import (
    PersonalSession, Member, User, CoachClient, CoachAvailability, 
    Notification, CoachAvailabilityOverride, CoachBreak, CoachSettings
)
from ..utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/personal-sessions", tags=["Personal Sessions"])


# ============================================================
# TEST ENDPOINT
# ============================================================

@router.get("/ping")
def ping():
    """Test if the router is working"""
    return {"message": "Personal sessions router is working!", "status": "ok"}


# ============================================================
# PYDANTIC MODELS
# ============================================================

class PersonalSessionCreate(BaseModel):
    date: date
    time: str
    end_time: str
    notes: Optional[str] = None


class PersonalSessionUpdate(BaseModel):
    date: Optional[date] = None
    time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PersonalSessionOut(BaseModel):
    id: int
    client_id: int
    coach_id: int
    date: date
    time: str
    end_time: str
    status: str
    notes: Optional[str]
    coach_notes: Optional[str] = None
    client_notes: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    is_recurring: bool = False
    recurring_group_id: Optional[str] = None
    recurring_parent_id: Optional[int] = None
    recurring_day_of_week: Optional[str] = None
    recurring_end_date: Optional[date] = None
    created_at: datetime
    coach_name: Optional[str] = None
    client_name: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# COACH AVAILABILITY OVERRIDE MODELS
# ============================================================

class CoachAvailabilityOverrideCreate(BaseModel):
    coach_id: int
    date: date
    start_time: str
    end_time: str
    is_available: bool


class CoachAvailabilityOverrideUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_available: Optional[bool] = None


class CoachAvailabilityOverrideOut(BaseModel):
    id: int
    coach_id: int
    date: date
    start_time: str
    end_time: str
    is_available: bool
    day_of_week: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# COACH BREAK MODELS
# ============================================================

class CoachBreakCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    is_recurring: bool = True
    date: Optional[date] = None  # For one-time breaks


class CoachBreakUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_recurring: Optional[bool] = None
    is_active: Optional[bool] = None


class CoachBreakOut(BaseModel):
    id: int
    coach_id: int
    day_of_week: Optional[str] = None
    start_time: str
    end_time: str
    is_recurring: bool
    is_active: bool
    date: Optional[date] = None

    class Config:
        from_attributes = True


# ============================================================
# COACH SETTINGS MODELS
# ============================================================

class CoachSettingsUpdate(BaseModel):
    max_sessions_per_day: Optional[int] = None
    session_duration: Optional[int] = None  # minutes
    buffer_between_sessions: Optional[int] = None  # minutes
    allow_auto_approval: Optional[bool] = None


class CoachSettingsOut(BaseModel):
    id: int
    coach_id: int
    max_sessions_per_day: int
    session_duration: int
    buffer_between_sessions: int
    allow_auto_approval: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# SESSION ACTION MODELS
# ============================================================

class SessionCancel(BaseModel):
    reason: Optional[str] = None


class SessionReschedule(BaseModel):
    new_date: date
    new_time: str
    new_end_time: str
    reason: Optional[str] = None


class SessionNotes(BaseModel):
    notes: str


class SessionFeedback(BaseModel):
    feedback: str
    rating: Optional[int] = Field(None, ge=1, le=5)


# ============================================================
# RECURRING SESSION MODELS
# ============================================================

class RecurringSessionCreate(BaseModel):
    date: date  # First session date
    time: str
    end_time: str
    notes: Optional[str] = None
    recurring_weeks: int = Field(default=4, ge=1, le=52)  # Number of weeks to repeat
    recurring_end_date: Optional[date] = None  # Alternative: specific end date


class RecurringSessionCancel(BaseModel):
    cancel_all: bool = False  # False = cancel just this one, True = cancel all
    reason: Optional[str] = None


# ============================================================
# CLIENT ENDPOINTS
# ============================================================

@router.get("/my", response_model=List[PersonalSessionOut])
def get_my_sessions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current member's personal sessions"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return []

    query = db.query(PersonalSession).filter(PersonalSession.client_id == member.id)

    if status:
        query = query.filter(PersonalSession.status == status)

    sessions = query.order_by(PersonalSession.date.desc()).all()

    result = []
    for session in sessions:
        coach = db.query(User).filter(User.id == session.coach_id).first()
        result.append({
            "id": session.id,
            "client_id": session.client_id,
            "coach_id": session.coach_id,
            "date": session.date,
            "time": session.time,
            "end_time": session.end_time,
            "status": session.status,
            "notes": session.notes,
            "coach_notes": session.coach_notes,
            "client_notes": session.client_notes,
            "feedback": session.feedback,
            "rating": session.rating,
            "is_recurring": session.is_recurring or False,
            "recurring_group_id": session.recurring_group_id,
            "recurring_parent_id": session.recurring_parent_id,
            "recurring_day_of_week": session.recurring_day_of_week,
            "recurring_end_date": session.recurring_end_date,
            "created_at": session.created_at,
            "coach_name": coach.name if coach else None,
            "client_name": current_user.name
        })

    return result


@router.post("/book")
def book_personal_session(
    data: PersonalSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Book a personal session with assigned coach"""
    print(f"📝 Booking request received:")
    print(f"  - User: {current_user.id} ({current_user.name})")
    print(f"  - Date: {data.date}")
    print(f"  - Time: {data.time} - {data.end_time}")

    try:
        # Get member
        member = db.query(Member).filter(Member.user_id == current_user.id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")

        # Check: Client has a coach assigned?
        coach_assignment = db.query(CoachClient).filter(
            CoachClient.client_id == member.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved"
        ).first()

        if not coach_assignment:
            raise HTTPException(
                status_code=403,
                detail="You don't have a coach assigned. Please find a coach first."
            )

        coach = db.query(User).filter(User.id == coach_assignment.coach_id).first()
        if not coach:
            raise HTTPException(status_code=404, detail="Assigned coach not found")

        print(f"✅ Coach: {coach.name}")

        # ─── CHECK AVAILABILITY ───

        # 1. Check date-specific override
        date_override = db.query(CoachAvailabilityOverride).filter(
            CoachAvailabilityOverride.coach_id == coach.id,
            CoachAvailabilityOverride.date == data.date
        ).first()

        if date_override:
            if not date_override.is_available:
                raise HTTPException(
                    status_code=400,
                    detail=f"Coach {coach.name} is not available on {data.date.strftime('%d %B %Y')}."
                )
            if data.time < date_override.start_time or data.end_time > date_override.end_time:
                raise HTTPException(
                    status_code=400,
                    detail=f"Coach is only available from {date_override.start_time} to {date_override.end_time} on this date."
                )
            print(f"✅ Using date override: {date_override.start_time} - {date_override.end_time}")
        else:
            # 2. Fall back to day-of-week pattern
            day_of_week = data.date.strftime('%A')

            coach_availability = db.query(CoachAvailability).filter(
                CoachAvailability.coach_id == coach.id,
                CoachAvailability.day_of_week == day_of_week,
                CoachAvailability.is_available == True
            ).first()

            if not coach_availability:
                raise HTTPException(
                    status_code=400,
                    detail=f"Coach {coach.name} is not available on {day_of_week}."
                )

            print(f"✅ Coach available: {coach_availability.start_time} - {coach_availability.end_time}")

            if data.time < coach_availability.start_time or data.end_time > coach_availability.end_time:
                raise HTTPException(
                    status_code=400,
                    detail=f"Coach is only available from {coach_availability.start_time} to {coach_availability.end_time} on {day_of_week}."
                )

        # 3. Check breaks
        break_conflict = check_coach_breaks(coach.id, data.date, data.time, data.end_time, db)
        if break_conflict:
            raise HTTPException(
                status_code=400,
                detail=f"Coach is on break at this time ({break_conflict.start_time} - {break_conflict.end_time})"
            )

        # 4. Check max sessions per day
        coach_settings = db.query(CoachSettings).filter(
            CoachSettings.coach_id == coach.id
        ).first()

        if coach_settings and coach_settings.max_sessions_per_day:
            day_sessions = db.query(PersonalSession).filter(
                PersonalSession.coach_id == coach.id,
                PersonalSession.date == data.date,
                PersonalSession.status.in_(["scheduled", "pending", "approved"])
            ).count()

            if day_sessions >= coach_settings.max_sessions_per_day:
                raise HTTPException(
                    status_code=400,
                    detail=f"Coach has reached maximum sessions for this day ({coach_settings.max_sessions_per_day})"
                )

        # 5. Check buffer between sessions
        if coach_settings and coach_settings.buffer_between_sessions:
            buffer_conflict = check_buffer_conflict(
                coach.id, data.date, data.time, data.end_time,
                coach_settings.buffer_between_sessions, db
            )
            if buffer_conflict:
                raise HTTPException(
                    status_code=400,
                    detail=f"Coach needs {coach_settings.buffer_between_sessions} minutes buffer between sessions"
                )

        # 6. Check overlap - coach
        existing_session = db.query(PersonalSession).filter(
            PersonalSession.coach_id == coach.id,
            PersonalSession.date == data.date,
            PersonalSession.status.in_(["scheduled", "pending", "approved"]),
            or_(
                (data.time >= PersonalSession.time) & (data.time < PersonalSession.end_time),
                (data.end_time > PersonalSession.time) & (data.end_time <= PersonalSession.end_time),
                (data.time <= PersonalSession.time) & (data.end_time >= PersonalSession.end_time)
            )
        ).first()

        if existing_session:
            raise HTTPException(
                status_code=400,
                detail="Coach already has a session at this time"
            )

        # 7. Check overlap - client
        existing_client = db.query(PersonalSession).filter(
            PersonalSession.client_id == member.id,
            PersonalSession.date == data.date,
            PersonalSession.status.in_(["scheduled", "pending", "approved"]),
            or_(
                (data.time >= PersonalSession.time) & (data.time < PersonalSession.end_time),
                (data.end_time > PersonalSession.time) & (data.end_time <= PersonalSession.end_time),
                (data.time <= PersonalSession.time) & (data.end_time >= PersonalSession.end_time)
            )
        ).first()

        if existing_client:
            raise HTTPException(
                status_code=400,
                detail="You already have a session at this time"
            )

        # ─── CREATE SESSION ───

        # Determine if auto-approval is enabled
        allow_auto_approval = True
        if coach_settings:
            allow_auto_approval = coach_settings.allow_auto_approval

        session_status = "scheduled" if allow_auto_approval else "pending"

        session = PersonalSession(
            client_id=member.id,
            coach_id=coach.id,
            date=data.date,
            time=data.time,
            end_time=data.end_time,
            notes=data.notes,
            status=session_status,
            is_recurring=False  # Single session
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        print(f"✅ Session created: ID {session.id} (status: {session_status})")

        # ─── SEND NOTIFICATIONS ───

        # Notify coach
        coach_notification = Notification(
            user_id=coach.id,
            title="New Session Booked",
            message=f"{member.user.name} has booked a session on {data.date.strftime('%d %B %Y')} at {data.time}.",
            type="info",
            is_read=False
        )
        db.add(coach_notification)

        # Notify member
        status_msg = "confirmed" if session_status == "scheduled" else "pending approval"
        member_notification = Notification(
            member_id=member.id,
            title=f"Session {status_msg.capitalize()}",
            message=f"Your session with Coach {coach.name} on {data.date.strftime('%d %B %Y')} at {data.time} is {status_msg}.",
            type="success" if session_status == "scheduled" else "warning",
            is_read=False
        )
        db.add(member_notification)

        db.commit()

        return {
            "id": session.id,
            "client_id": session.client_id,
            "coach_id": session.coach_id,
            "date": session.date,
            "time": session.time,
            "end_time": session.end_time,
            "status": session.status,
            "notes": session.notes,
            "coach_notes": session.coach_notes,
            "client_notes": session.client_notes,
            "feedback": session.feedback,
            "rating": session.rating,
            "is_recurring": False,
            "created_at": session.created_at,
            "coach_name": coach.name,
            "client_name": current_user.name
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/book/recurring")
def book_recurring_session(
    data: RecurringSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book a recurring session that repeats weekly.
    """
    print(f"📝 Recurring booking request received:")
    print(f"  - User: {current_user.id} ({current_user.name})")
    print(f"  - Date: {data.date}")
    print(f"  - Time: {data.time} - {data.end_time}")
    print(f"  - Weeks: {data.recurring_weeks}")

    try:
        # Get member
        member = db.query(Member).filter(Member.user_id == current_user.id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")

        # Check: Client has a coach assigned?
        coach_assignment = db.query(CoachClient).filter(
            CoachClient.client_id == member.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved"
        ).first()

        if not coach_assignment:
            raise HTTPException(
                status_code=403,
                detail="You don't have a coach assigned. Please find a coach first."
            )

        coach = db.query(User).filter(User.id == coach_assignment.coach_id).first()
        if not coach:
            raise HTTPException(status_code=404, detail="Assigned coach not found")

        print(f"✅ Coach: {coach.name}")

        # Generate recurring session dates
        recurring_group_id = str(uuid.uuid4())
        sessions_created = []
        current_date = data.date
        recurring_day_of_week = data.date.strftime('%A')
        
        # Calculate end date
        if data.recurring_end_date:
            end_date = data.recurring_end_date
        else:
            end_date = current_date + timedelta(weeks=data.recurring_weeks)

        # Get coach settings for auto-approval
        coach_settings = db.query(CoachSettings).filter(
            CoachSettings.coach_id == coach.id
        ).first()
        allow_auto_approval = True
        if coach_settings:
            allow_auto_approval = coach_settings.allow_auto_approval
        session_status = "scheduled" if allow_auto_approval else "pending"

        week_count = 0
        first_session_id = None
        
        while current_date <= end_date and week_count < data.recurring_weeks:
            # Check if this date should be skipped (e.g., coach not available)
            should_skip = False
            skip_reason = None
            
            # Check availability for this date
            date_override = db.query(CoachAvailabilityOverride).filter(
                CoachAvailabilityOverride.coach_id == coach.id,
                CoachAvailabilityOverride.date == current_date
            ).first()

            if date_override:
                if not date_override.is_available:
                    should_skip = True
                    skip_reason = "Coach not available (override)"
                elif data.time < date_override.start_time or data.end_time > date_override.end_time:
                    should_skip = True
                    skip_reason = "Time outside override hours"
            else:
                day_of_week = current_date.strftime('%A')
                coach_availability = db.query(CoachAvailability).filter(
                    CoachAvailability.coach_id == coach.id,
                    CoachAvailability.day_of_week == day_of_week,
                    CoachAvailability.is_available == True
                ).first()
                
                if not coach_availability:
                    should_skip = True
                    skip_reason = f"Coach not available on {day_of_week}"
                elif data.time < coach_availability.start_time or data.end_time > coach_availability.end_time:
                    should_skip = True
                    skip_reason = f"Time outside availability hours ({coach_availability.start_time} - {coach_availability.end_time})"

            # Check for breaks
            if not should_skip:
                break_conflict = check_coach_breaks(coach.id, current_date, data.time, data.end_time, db)
                if break_conflict:
                    should_skip = True
                    skip_reason = f"Coach on break ({break_conflict.start_time} - {break_conflict.end_time})"

            # Check max sessions per day
            if not should_skip and coach_settings and coach_settings.max_sessions_per_day:
                day_sessions = db.query(PersonalSession).filter(
                    PersonalSession.coach_id == coach.id,
                    PersonalSession.date == current_date,
                    PersonalSession.status.in_(["scheduled", "pending", "approved"])
                ).count()
                if day_sessions >= coach_settings.max_sessions_per_day:
                    should_skip = True
                    skip_reason = f"Max sessions per day reached ({coach_settings.max_sessions_per_day})"

            if not should_skip:
                # Check for overlapping sessions
                existing = db.query(PersonalSession).filter(
                    PersonalSession.coach_id == coach.id,
                    PersonalSession.date == current_date,
                    PersonalSession.status.in_(["scheduled", "pending", "approved"]),
                    or_(
                        (data.time >= PersonalSession.time) & (data.time < PersonalSession.end_time),
                        (data.end_time > PersonalSession.time) & (data.end_time <= PersonalSession.end_time),
                        (data.time <= PersonalSession.time) & (data.end_time >= PersonalSession.end_time)
                    )
                ).first()

                if not existing:
                    # Create the session
                    session = PersonalSession(
                        client_id=member.id,
                        coach_id=coach.id,
                        date=current_date,
                        time=data.time,
                        end_time=data.end_time,
                        notes=data.notes,
                        status=session_status,
                        is_recurring=True,
                        recurring_group_id=recurring_group_id,
                        recurring_day_of_week=recurring_day_of_week,
                        recurring_end_date=end_date,
                    )
                    db.add(session)
                    db.flush()  # Get the ID
                    
                    # Set parent_id for all sessions (first session is the parent)
                    if first_session_id is None:
                        first_session_id = session.id
                        session.recurring_parent_id = session.id
                    else:
                        session.recurring_parent_id = first_session_id
                    
                    sessions_created.append(session)
                    print(f"✅ Created session for {current_date}")
                else:
                    print(f"⚠️ Skipped {current_date}: Overlap with existing session")
            else:
                print(f"⚠️ Skipped {current_date}: {skip_reason}")

            # Move to next week
            current_date += timedelta(days=7)
            week_count += 1

        if not sessions_created:
            raise HTTPException(
                status_code=400,
                detail="Could not create any recurring sessions. Please check your availability."
            )

        db.commit()

        # Refresh all sessions to get their IDs
        for session in sessions_created:
            db.refresh(session)

        print(f"✅ Created {len(sessions_created)} recurring sessions")

        # Send notifications
        if sessions_created:
            # Notify coach
            coach_notification = Notification(
                user_id=coach.id,
                title="Recurring Sessions Booked",
                message=f"{member.user.name} has booked {len(sessions_created)} recurring sessions starting {data.date.strftime('%d %B %Y')} at {data.time}.",
                type="info",
                is_read=False
            )
            db.add(coach_notification)

            # Notify member
            member_notification = Notification(
                member_id=member.id,
                title=f"{len(sessions_created)} Recurring Sessions Booked",
                message=f"Your recurring sessions with Coach {coach.name} have been confirmed. {len(sessions_created)} sessions scheduled.",
                type="success",
                is_read=False
            )
            db.add(member_notification)
            db.commit()

        return {
            "message": f"Created {len(sessions_created)} recurring sessions",
            "sessions_created": len(sessions_created),
            "recurring_group_id": recurring_group_id,
            "start_date": data.date,
            "end_date": end_date,
            "sessions": [
                {
                    "id": s.id,
                    "date": s.date,
                    "time": s.time,
                    "end_time": s.end_time,
                    "status": s.status
                }
                for s in sessions_created
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ============================================================
# RECURRING SESSION CANCEL
# ============================================================

@router.put("/recurring/{group_id}/cancel")
def cancel_recurring_sessions(
    group_id: str,
    data: RecurringSessionCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a recurring session group.
    - If cancel_all=True: cancel all sessions in the group
    - If cancel_all=False: cancel only the next upcoming session
    """
    
    # Get all sessions in this group
    sessions = db.query(PersonalSession).filter(
        PersonalSession.recurring_group_id == group_id,
        PersonalSession.status.in_(["scheduled", "pending", "approved"])
    ).order_by(PersonalSession.date).all()
    
    if not sessions:
        raise HTTPException(status_code=404, detail="No recurring sessions found")
    
    # Check authorization
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    is_member_owner = member and sessions[0].client_id == member.id
    is_coach_or_admin = (
        current_user.role == "admin" or
        (current_user.role == "coach" and sessions[0].coach_id == current_user.id)
    )
    
    if not is_member_owner and not is_coach_or_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if data.cancel_all:
        # Cancel all sessions
        for session in sessions:
            session.status = "cancelled"
            session.cancelled_by = "member" if is_member_owner else "coach"
            session.cancelled_at = datetime.utcnow()
            session.cancellation_reason = data.reason
        
        db.commit()
        
        # Notify coach
        if is_member_owner:
            notification = Notification(
                user_id=sessions[0].coach_id,
                title="Recurring Sessions Cancelled",
                message=f"All recurring sessions have been cancelled.",
                type="error",
                is_read=False
            )
            db.add(notification)
            db.commit()
        
        return {"message": f"Cancelled all {len(sessions)} recurring sessions"}
    else:
        # Cancel only the next upcoming session
        next_session = sessions[0]  # Already sorted by date
        next_session.status = "cancelled"
        next_session.cancelled_by = "member" if is_member_owner else "coach"
        next_session.cancelled_at = datetime.utcnow()
        next_session.cancellation_reason = data.reason
        db.commit()
        
        return {
            "message": f"Cancelled session on {next_session.date}",
            "remaining_sessions": len(sessions) - 1
        }


@router.get("/recurring/{group_id}")
def get_recurring_sessions(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sessions in a recurring group"""
    
    sessions = db.query(PersonalSession).filter(
        PersonalSession.recurring_group_id == group_id
    ).order_by(PersonalSession.date).all()
    
    if not sessions:
        raise HTTPException(status_code=404, detail="No recurring sessions found")
    
    # Check authorization
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    is_member_owner = member and sessions[0].client_id == member.id
    is_coach_or_admin = (
        current_user.role == "admin" or
        (current_user.role == "coach" and sessions[0].coach_id == current_user.id)
    )
    
    if not is_member_owner and not is_coach_or_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "group_id": group_id,
        "total_sessions": len(sessions),
        "sessions": [
            {
                "id": s.id,
                "date": s.date,
                "time": s.time,
                "end_time": s.end_time,
                "status": s.status,
                "is_recurring": s.is_recurring,
            }
            for s in sessions
        ]
    }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def check_coach_breaks(coach_id: int, session_date: date, start_time: str, end_time: str, db: Session):
    """Check if a time slot conflicts with coach breaks"""
    day_of_week = session_date.strftime('%A')
    
    # Check recurring breaks
    recurring_breaks = db.query(CoachBreak).filter(
        CoachBreak.coach_id == coach_id,
        CoachBreak.day_of_week == day_of_week,
        CoachBreak.is_recurring == True,
        CoachBreak.is_active == True
    ).all()
    
    # Check one-time breaks for this date
    one_time_breaks = db.query(CoachBreak).filter(
        CoachBreak.coach_id == coach_id,
        CoachBreak.date == session_date,
        CoachBreak.is_recurring == False,
        CoachBreak.is_active == True
    ).all()
    
    all_breaks = recurring_breaks + one_time_breaks
    
    for break_time in all_breaks:
        # Check if session overlaps with break
        if (start_time < break_time.end_time and end_time > break_time.start_time):
            return break_time
    
    return None


def check_buffer_conflict(coach_id: int, session_date: date, start_time: str, end_time: str, buffer_minutes: int, db: Session):
    """Check if there's a session too close to this time (buffer conflict)"""
    # Get all sessions on this date
    sessions = db.query(PersonalSession).filter(
        PersonalSession.coach_id == coach_id,
        PersonalSession.date == session_date,
        PersonalSession.status.in_(["scheduled", "pending", "approved"])
    ).all()
    
    # Convert times to minutes for easier comparison
    def time_to_minutes(t):
        h, m = map(int, t.split(':'))
        return h * 60 + m
    
    start_min = time_to_minutes(start_time)
    end_min = time_to_minutes(end_time)
    
    for session in sessions:
        session_start = time_to_minutes(session.time)
        session_end = time_to_minutes(session.end_time)
        
        # Check if there's a buffer violation
        # New session starts before existing ends + buffer
        if start_min < session_end + buffer_minutes and end_min > session_start - buffer_minutes:
            return session
    
    return None


# ============================================================
# COACH ENDPOINTS
# ============================================================

@router.get("/coach", response_model=List[PersonalSessionOut])
def get_coach_sessions(
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get sessions for the current coach with filters"""
    if current_user.role == "admin":
        query = db.query(PersonalSession)
    else:
        query = db.query(PersonalSession).filter(
            PersonalSession.coach_id == current_user.id
        )

    if status:
        query = query.filter(PersonalSession.status == status)
    
    if date_from:
        query = query.filter(PersonalSession.date >= date_from)
    
    if date_to:
        query = query.filter(PersonalSession.date <= date_to)

    sessions = query.order_by(PersonalSession.date.desc()).all()

    result = []
    for session in sessions:
        coach = db.query(User).filter(User.id == session.coach_id).first()
        client = db.query(Member).filter(Member.id == session.client_id).first()

        result.append({
            "id": session.id,
            "client_id": session.client_id,
            "coach_id": session.coach_id,
            "date": session.date,
            "time": session.time,
            "end_time": session.end_time,
            "status": session.status,
            "notes": session.notes,
            "coach_notes": session.coach_notes,
            "client_notes": session.client_notes,
            "feedback": session.feedback,
            "rating": session.rating,
            "is_recurring": session.is_recurring or False,
            "recurring_group_id": session.recurring_group_id,
            "recurring_parent_id": session.recurring_parent_id,
            "recurring_day_of_week": session.recurring_day_of_week,
            "recurring_end_date": session.recurring_end_date,
            "created_at": session.created_at,
            "coach_name": coach.name if coach else None,
            "client_name": client.user.name if client else None
        })

    return result


# ─── APPROVE / REJECT SESSIONS ───

@router.put("/coach/sessions/{session_id}/approve")
def approve_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Coach approves a pending session"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    if session.status != "pending":
        raise HTTPException(status_code=400, detail="Session is not pending approval")
    
    session.status = "scheduled"
    session.approved_at = datetime.utcnow()
    db.commit()
    
    # Notify member
    notification = Notification(
        member_id=session.client_id,
        title="Session Approved",
        message=f"Your session on {session.date.strftime('%d %B %Y')} at {session.time} has been approved.",
        type="success",
        is_read=False
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Session approved successfully"}


@router.put("/coach/sessions/{session_id}/reject")
def reject_session(
    session_id: int,
    data: SessionCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Coach rejects a pending session"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    if session.status != "pending":
        raise HTTPException(status_code=400, detail="Session is not pending approval")
    
    session.status = "rejected"
    session.rejected_at = datetime.utcnow()
    session.rejection_reason = data.reason
    db.commit()
    
    # Notify member
    notification = Notification(
        member_id=session.client_id,
        title="Session Rejected",
        message=f"Your session on {session.date.strftime('%d %B %Y')} at {session.time} was rejected. Reason: {data.reason or 'Not specified'}",
        type="error",
        is_read=False
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Session rejected"}


# ─── COMPLETE SESSION ───

@router.put("/coach/sessions/{session_id}/complete")
def complete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Coach marks a session as completed"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if session.status in ["cancelled", "rejected"]:
        raise HTTPException(status_code=400, detail=f"Cannot complete a {session.status} session")

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    db.commit()

    return {"message": "Session marked as completed"}


# ─── CANCEL SESSION (COACH) ───

@router.put("/coach/sessions/{session_id}/cancel")
def coach_cancel_session(
    session_id: int,
    data: SessionCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Coach cancels a session"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    if session.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {session.status} session")
    
    session.status = "cancelled"
    session.cancelled_by = "coach"
    session.cancelled_at = datetime.utcnow()
    session.cancellation_reason = data.reason
    db.commit()
    
    # Notify member
    notification = Notification(
        member_id=session.client_id,
        title="Session Cancelled by Coach",
        message=f"Your session on {session.date.strftime('%d %B %Y')} at {session.time} was cancelled. Reason: {data.reason or 'Not specified'}",
        type="error",
        is_read=False
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Session cancelled successfully"}


# ─── RESCHEDULE SESSION ───

@router.put("/coach/sessions/{session_id}/reschedule")
def reschedule_session(
    session_id: int,
    data: SessionReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Coach reschedules a session to a new date/time"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    if session.status in ["completed", "cancelled", "rejected"]:
        raise HTTPException(status_code=400, detail=f"Cannot reschedule a {session.status} session")
    
    # Check new time availability (reuse booking logic)
    # Check date override
    date_override = db.query(CoachAvailabilityOverride).filter(
        CoachAvailabilityOverride.coach_id == current_user.id,
        CoachAvailabilityOverride.date == data.new_date
    ).first()
    
    if date_override:
        if not date_override.is_available:
            raise HTTPException(status_code=400, detail="Coach is not available on the new date")
        if data.new_time < date_override.start_time or data.new_end_time > date_override.end_time:
            raise HTTPException(status_code=400, detail="New time is outside coach's availability")
    else:
        day_of_week = data.new_date.strftime('%A')
        coach_availability = db.query(CoachAvailability).filter(
            CoachAvailability.coach_id == current_user.id,
            CoachAvailability.day_of_week == day_of_week,
            CoachAvailability.is_available == True
        ).first()
        
        if not coach_availability:
            raise HTTPException(status_code=400, detail=f"Coach is not available on {day_of_week}")
        if data.new_time < coach_availability.start_time or data.new_end_time > coach_availability.end_time:
            raise HTTPException(status_code=400, detail="New time is outside coach's availability")
    
    # Check overlap with other sessions
    # (excluding this session itself)
    overlap = db.query(PersonalSession).filter(
        PersonalSession.coach_id == current_user.id,
        PersonalSession.date == data.new_date,
        PersonalSession.id != session_id,
        PersonalSession.status.in_(["scheduled", "pending", "approved"]),
        or_(
            (data.new_time >= PersonalSession.time) & (data.new_time < PersonalSession.end_time),
            (data.new_end_time > PersonalSession.time) & (data.new_end_time <= PersonalSession.end_time),
            (data.new_time <= PersonalSession.time) & (data.new_end_time >= PersonalSession.end_time)
        )
    ).first()
    
    if overlap:
        raise HTTPException(status_code=400, detail="Coach already has a session at the new time")
    
    # Save old date/time for notification
    old_date = session.date
    old_time = session.time
    
    # Update session
    session.date = data.new_date
    session.time = data.new_time
    session.end_time = data.new_end_time
    session.rescheduled_at = datetime.utcnow()
    session.reschedule_reason = data.reason
    db.commit()
    
    # Notify member
    notification = Notification(
        member_id=session.client_id,
        title="Session Rescheduled",
        message=f"Your session has been moved from {old_date.strftime('%d %B %Y')} at {old_time} to {data.new_date.strftime('%d %B %Y')} at {data.new_time}. Reason: {data.reason or 'Not specified'}",
        type="info",
        is_read=False
    )
    db.add(notification)
    db.commit()
    
    return {
        "message": "Session rescheduled successfully",
        "old_date": old_date,
        "old_time": old_time,
        "new_date": data.new_date,
        "new_time": data.new_time
    }


# ─── ADD COACH NOTES ───

@router.put("/coach/sessions/{session_id}/notes")
def add_coach_notes(
    session_id: int,
    data: SessionNotes,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Add private coach notes to a session"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    session.coach_notes = data.notes
    db.commit()
    
    return {"message": "Coach notes added successfully"}


# ─── ADD CLIENT NOTES ───

@router.put("/coach/sessions/{session_id}/client-notes")
def add_client_notes(
    session_id: int,
    data: SessionNotes,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Add client-facing notes to a session (visible to client)"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    session.client_notes = data.notes
    db.commit()
    
    # Notify member
    notification = Notification(
        member_id=session.client_id,
        title="New Notes Added",
        message=f"Coach has added notes to your session on {session.date.strftime('%d %B %Y')} at {session.time}.",
        type="info",
        is_read=False
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Client notes added successfully"}


# ─── ADD FEEDBACK ───

@router.put("/coach/sessions/{session_id}/feedback")
def add_session_feedback(
    session_id: int,
    data: SessionFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Add feedback and rating to a completed session"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Can only add feedback to completed sessions")
    
    session.feedback = data.feedback
    session.rating = data.rating
    db.commit()
    
    return {"message": "Feedback added successfully"}


# ─── GET SESSION DETAIL ───

@router.get("/coach/sessions/{session_id}")
def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get detailed session information"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user.role == "coach" and session.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    
    coach = db.query(User).filter(User.id == session.coach_id).first()
    client = db.query(Member).filter(Member.id == session.client_id).first()
    
    return {
        "id": session.id,
        "client_id": session.client_id,
        "coach_id": session.coach_id,
        "date": session.date,
        "time": session.time,
        "end_time": session.end_time,
        "status": session.status,
        "notes": session.notes,
        "coach_notes": session.coach_notes,
        "client_notes": session.client_notes,
        "feedback": session.feedback,
        "rating": session.rating,
        "is_recurring": session.is_recurring or False,
        "recurring_group_id": session.recurring_group_id,
        "recurring_parent_id": session.recurring_parent_id,
        "recurring_day_of_week": session.recurring_day_of_week,
        "recurring_end_date": session.recurring_end_date,
        "created_at": session.created_at,
        "approved_at": getattr(session, 'approved_at', None),
        "completed_at": getattr(session, 'completed_at', None),
        "cancelled_at": getattr(session, 'cancelled_at', None),
        "cancelled_by": getattr(session, 'cancelled_by', None),
        "cancellation_reason": getattr(session, 'cancellation_reason', None),
        "rescheduled_at": getattr(session, 'rescheduled_at', None),
        "reschedule_reason": getattr(session, 'reschedule_reason', None),
        "coach_name": coach.name if coach else None,
        "client_name": client.user.name if client else None
    }


# ============================================================
# COACH BREAK ENDPOINTS
# ============================================================

@router.get("/coach/breaks")
def get_coach_breaks(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get all breaks for the current coach"""
    if current_user.role == "admin":
        breaks = db.query(CoachBreak).all()
    else:
        breaks = db.query(CoachBreak).filter(
            CoachBreak.coach_id == current_user.id,
            CoachBreak.is_active == True
        ).all()
    
    return breaks


@router.post("/coach/breaks")
def create_coach_break(
    data: CoachBreakCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Create a break for the coach"""
    if current_user.role == "coach":
        coach_id = current_user.id
    else:
        coach_id = current_user.id
    
    # Validate time range
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")
    
    break_time = CoachBreak(
        coach_id=coach_id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        is_recurring=data.is_recurring,
        date=data.date if not data.is_recurring else None,
        is_active=True
    )
    db.add(break_time)
    db.commit()
    db.refresh(break_time)
    
    return {"message": "Break created successfully", "id": break_time.id}


@router.put("/coach/breaks/{break_id}")
def update_coach_break(
    break_id: int,
    data: CoachBreakUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Update a coach break"""
    break_time = db.query(CoachBreak).filter(CoachBreak.id == break_id).first()
    if not break_time:
        raise HTTPException(status_code=404, detail="Break not found")
    
    if current_user.role == "coach" and break_time.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if data.start_time is not None:
        if data.start_time >= data.end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
        break_time.start_time = data.start_time
    
    if data.end_time is not None:
        if data.start_time and data.start_time >= data.end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
        break_time.end_time = data.end_time
    
    if data.is_recurring is not None:
        break_time.is_recurring = data.is_recurring
    
    if data.is_active is not None:
        break_time.is_active = data.is_active
    
    db.commit()
    db.refresh(break_time)
    
    return {"message": "Break updated successfully"}


@router.delete("/coach/breaks/{break_id}")
def delete_coach_break(
    break_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Delete a coach break"""
    break_time = db.query(CoachBreak).filter(CoachBreak.id == break_id).first()
    if not break_time:
        raise HTTPException(status_code=404, detail="Break not found")
    
    if current_user.role == "coach" and break_time.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(break_time)
    db.commit()
    
    return {"message": "Break deleted successfully"}


# ============================================================
# COACH SETTINGS ENDPOINTS
# ============================================================

@router.get("/coach/settings")
def get_coach_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get coach settings"""
    settings = db.query(CoachSettings).filter(
        CoachSettings.coach_id == current_user.id
    ).first()
    
    if not settings:
        # Create default settings if none exist
        settings = CoachSettings(
            coach_id=current_user.id,
            max_sessions_per_day=8,
            session_duration=60,
            buffer_between_sessions=15,
            allow_auto_approval=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


@router.put("/coach/settings")
def update_coach_settings(
    data: CoachSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Update coach settings"""
    settings = db.query(CoachSettings).filter(
        CoachSettings.coach_id == current_user.id
    ).first()
    
    if not settings:
        settings = CoachSettings(
            coach_id=current_user.id,
            max_sessions_per_day=8,
            session_duration=60,
            buffer_between_sessions=15,
            allow_auto_approval=True
        )
        db.add(settings)
    
    if data.max_sessions_per_day is not None:
        settings.max_sessions_per_day = data.max_sessions_per_day
    if data.session_duration is not None:
        settings.session_duration = data.session_duration
    if data.buffer_between_sessions is not None:
        settings.buffer_between_sessions = data.buffer_between_sessions
    if data.allow_auto_approval is not None:
        settings.allow_auto_approval = data.allow_auto_approval
    
    db.commit()
    db.refresh(settings)
    
    return settings


# ============================================================
# MEMBER CANCEL SESSION (Existing - keeping)
# ============================================================

@router.put("/{session_id}/cancel")
def cancel_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a personal session (member, coach, or admin)"""
    session = db.query(PersonalSession).filter(PersonalSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Member cancelling their own session
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    is_member_owner = member and session.client_id == member.id

    # Coach cancelling one of their sessions, or admin cancelling any
    is_coach_or_admin = (
        current_user.role == "admin" or
        (current_user.role == "coach" and session.coach_id == current_user.id)
    )

    if not is_member_owner and not is_coach_or_admin:
        raise HTTPException(status_code=403, detail="Not authorized")

    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed session")

    if session.status == "cancelled":
        raise HTTPException(status_code=400, detail="Session is already cancelled")

    session.status = "cancelled"
    session.cancelled_by = "member" if is_member_owner else "coach"
    session.cancelled_at = datetime.utcnow()
    db.commit()

    return {"message": "Session cancelled successfully"}


# ============================================================
# GET BOOKED SLOTS — ADMIN/COACH VERSION
# ============================================================

@router.get("/coach/booked/admin/{date}")
def get_coach_booked_sessions_admin(
    date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """
    COACH/ADMIN: Get booked sessions for the current coach on a specific date.
    Admin sees all sessions across all coaches.
    """
    try:
        session_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if current_user.role == "admin":
        sessions = db.query(PersonalSession).filter(
            PersonalSession.date == session_date,
            PersonalSession.status.in_(["scheduled", "pending", "approved"])
        ).all()
    else:
        sessions = db.query(PersonalSession).filter(
            PersonalSession.coach_id == current_user.id,
            PersonalSession.date == session_date,
            PersonalSession.status.in_(["scheduled", "pending", "approved"])
        ).all()

    result = []
    for session in sessions:
        client = db.query(Member).filter(Member.id == session.client_id).first()
        result.append({
            "id": session.id,
            "time": session.time,
            "end_time": session.end_time,
            "client_id": session.client_id,
            "client_name": client.user.name if client else "Unknown",
            "status": session.status
        })

    return result


# ============================================================
# GET BOOKED SLOTS — MEMBER VERSION
# ============================================================

@router.get("/coach/booked/{date}")
def get_coach_booked_sessions(
    date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get all booked sessions for the current user's assigned coach on a
    specific date. Includes sessions from other members — used to grey out
    already-taken slots in the booking UI.
    """
    print(f"\n🔍 GET COACH BOOKED SESSIONS")
    print(f"  Date: {date}")
    print(f"  User: {current_user.id} ({current_user.email})")
    print(f"  Role: {current_user.role}")

    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        print(f"  ❌ Member not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Member profile not found")

    print(f"  Member ID: {member.id}")

    coach_assignment = db.query(CoachClient).filter(
        CoachClient.client_id == member.id,
        CoachClient.is_active == True,
        CoachClient.status == "approved"
    ).first()

    if not coach_assignment:
        print(f"  ❌ No active coach assignment found")
        return []

    coach_id = coach_assignment.coach_id
    print(f"  Coach ID: {coach_id}")

    try:
        session_date = datetime.strptime(date, '%Y-%m-%d').date()
        print(f"  Parsed date: {session_date}")
    except ValueError:
        print(f"  ❌ Invalid date format: {date}")
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    booked_sessions = db.query(PersonalSession).filter(
        PersonalSession.coach_id == coach_id,
        PersonalSession.date == session_date,
        PersonalSession.status.in_(["scheduled", "pending", "approved"])
    ).all()

    print(f"  Found {len(booked_sessions)} booked sessions")
    for s in booked_sessions:
        print(f"    - Time: {s.time} - {s.end_time}, Client ID: {s.client_id}")

    result = []
    for session in booked_sessions:
        result.append({
            "id": session.id,
            "time": session.time,
            "end_time": session.end_time,
            "client_id": session.client_id,
            "status": session.status
        })

    print(f"  ✅ Returning {len(result)} booked slots")
    return result


# ============================================================
# COACH AVAILABILITY OVERRIDE ENDPOINTS
# ============================================================

@router.get("/coach/availability/overrides")
def get_coach_availability_overrides(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """
    Get all date-specific availability overrides for the current coach.
    """
    if current_user.role == "admin":
        overrides = db.query(CoachAvailabilityOverride).all()
    else:
        overrides = db.query(CoachAvailabilityOverride).filter(
            CoachAvailabilityOverride.coach_id == current_user.id
        ).all()

    result = []
    for override in overrides:
        result.append({
            "id": override.id,
            "coach_id": override.coach_id,
            "date": override.date,
            "start_time": override.start_time,
            "end_time": override.end_time,
            "is_available": override.is_available,
            "day_of_week": override.date.strftime('%A')
        })

    return result


@router.post("/coach/availability/date")
def create_coach_availability_override(
    data: CoachAvailabilityOverrideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """
    Create a date-specific availability override for the current coach.
    """
    if current_user.role == "coach":
        coach_id = current_user.id
    else:
        coach_id = data.coach_id

    # Check if override already exists for this date
    existing = db.query(CoachAvailabilityOverride).filter(
        CoachAvailabilityOverride.coach_id == coach_id,
        CoachAvailabilityOverride.date == data.date
    ).first()

    if existing:
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.is_available = data.is_available
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "coach_id": existing.coach_id,
            "date": existing.date,
            "start_time": existing.start_time,
            "end_time": existing.end_time,
            "is_available": existing.is_available,
            "day_of_week": existing.date.strftime('%A'),
            "message": "Override updated successfully"
        }

    override = CoachAvailabilityOverride(
        coach_id=coach_id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        is_available=data.is_available
    )
    db.add(override)
    db.commit()
    db.refresh(override)

    return {
        "id": override.id,
        "coach_id": override.coach_id,
        "date": override.date,
        "start_time": override.start_time,
        "end_time": override.end_time,
        "is_available": override.is_available,
        "day_of_week": override.date.strftime('%A'),
        "message": "Override created successfully"
    }


@router.put("/coach/availability/date/{override_id}")
def update_coach_availability_override(
    override_id: int,
    data: CoachAvailabilityOverrideUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Update a date-specific availability override."""
    override = db.query(CoachAvailabilityOverride).filter(
        CoachAvailabilityOverride.id == override_id
    ).first()

    if not override:
        raise HTTPException(status_code=404, detail="Override not found")

    if current_user.role == "coach" and override.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if data.start_time is not None:
        override.start_time = data.start_time
    if data.end_time is not None:
        override.end_time = data.end_time
    if data.is_available is not None:
        override.is_available = data.is_available

    db.commit()
    db.refresh(override)

    return {
        "id": override.id,
        "coach_id": override.coach_id,
        "date": override.date,
        "start_time": override.start_time,
        "end_time": override.end_time,
        "is_available": override.is_available,
        "day_of_week": override.date.strftime('%A'),
        "message": "Override updated successfully"
    }


@router.delete("/coach/availability/date/{override_id}")
def delete_coach_availability_override(
    override_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Delete a date-specific availability override."""
    override = db.query(CoachAvailabilityOverride).filter(
        CoachAvailabilityOverride.id == override_id
    ).first()

    if not override:
        raise HTTPException(status_code=404, detail="Override not found")

    if current_user.role == "coach" and override.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(override)
    db.commit()

    return {"message": "Override deleted successfully"}


@router.get("/coach/availability/date/{date}")
def get_coach_availability_for_date(
    date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get coach availability for a specific date."""
    try:
        session_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    override = db.query(CoachAvailabilityOverride).filter(
        CoachAvailabilityOverride.coach_id == current_user.id,
        CoachAvailabilityOverride.date == session_date
    ).first()

    if override:
        return {
            "id": override.id,
            "coach_id": override.coach_id,
            "date": override.date,
            "start_time": override.start_time,
            "end_time": override.end_time,
            "is_available": override.is_available,
            "day_of_week": override.date.strftime('%A'),
            "is_override": True
        }

    day_of_week = session_date.strftime('%A')
    availability = db.query(CoachAvailability).filter(
        CoachAvailability.coach_id == current_user.id,
        CoachAvailability.day_of_week == day_of_week
    ).first()

    if availability:
        return {
            "id": availability.id,
            "coach_id": availability.coach_id,
            "date": session_date,
            "start_time": availability.start_time,
            "end_time": availability.end_time,
            "is_available": availability.is_available,
            "day_of_week": day_of_week,
            "is_override": False
        }

    return None