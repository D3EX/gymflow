# backend/app/routers/coach.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import date as date_type, datetime, timedelta
from pydantic import BaseModel
from ..database import get_db
from ..utils.auth import get_current_user, require_admin, require_role
from ..models.models import (
    User, Member, CoachClient, ClientProgress, Program, Notification, 
    Staff, CoachAvailability, Class, ProgramWeek, ProgramDay, Exercise,
    PersonalSession, Subscription, Plan, Payment, Attendance, MealPlan, 
    MealDay, Meal, ClientNote
)
from ..schemas.schemas import (
    ProgramCreate, ProgramUpdate, ProgramWeekCreate, ProgramWeekUpdate,
    ProgramDayCreate, ProgramDayUpdate, ExerciseCreate, ExerciseUpdate,
    ProgramOut, ProgramWeekOut, ProgramDayOut, ExerciseOut
)

router = APIRouter(prefix="/api/coach", tags=["Coach"])


# ============================================================
# PYDANTIC MODELS
# ============================================================

class ClientProgressCreate(BaseModel):
    client_id: int
    date: Optional[date_type] = None
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = None


class CoachAvailabilityCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    is_available: bool = True


class CoachAvailabilityUpdate(BaseModel):
    is_available: Optional[bool] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


# ============================================================
# CLIENT DETAIL PYDANTIC MODELS
# ============================================================

class ClientSessionOut(BaseModel):
    id: int
    type: str
    date: str
    time: str
    duration: int
    status: str  # upcoming, completed, missed, cancelled, pending

    class Config:
        from_attributes = True


class ClientProgramOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_date: Optional[date_type]
    end_date: Optional[date_type]
    coach_name: Optional[str]
    is_active: bool
    progress: float
    current_week: int
    total_weeks: int
    weeks: List[dict]

    class Config:
        from_attributes = True


class ClientNutritionOut(BaseModel):
    has_plan: bool
    target_calories: int
    water_goal: float
    days: List[dict]

    class Config:
        from_attributes = True


class ClientProgressOut(BaseModel):
    weight: List[dict]  # [{date, value}]
    body_fat: List[dict]  # [{date, value}]
    muscle_mass: List[dict]  # [{date, value}]
    attendance_rate: float
    program_progress: float

    class Config:
        from_attributes = True


class ClientPaymentOut(BaseModel):
    id: int
    invoice_id: str
    amount: float
    status: str
    date: str
    description: str

    class Config:
        from_attributes = True


class ClientNoteOut(BaseModel):
    id: int
    text: str
    created_at: datetime
    pinned: bool

    class Config:
        from_attributes = True


class ClientDetailResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    phone: Optional[str]
    status: str
    created_at: datetime
    progress: float
    attendance_rate: float
    streak: int
    session_count: int
    membership_plan: Optional[str]
    next_session: Optional[dict]
    sessions: List[ClientSessionOut]
    program: Optional[ClientProgramOut]
    nutrition: ClientNutritionOut
    progress_data: ClientProgressOut
    notes: List[ClientNoteOut]
    payments: List[ClientPaymentOut]

    class Config:
        from_attributes = True


# ============================================================
# NOTE PYDANTIC MODELS
# ============================================================

class NoteCreate(BaseModel):
    text: str
    pinned: bool = False


class NoteUpdate(BaseModel):
    text: Optional[str] = None
    pinned: Optional[bool] = None


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def remove_program_from_member(db: Session, member_id: int, coach_name: str):
    """Remove/deactivate coach's program from a member"""
    programs = db.query(Program).filter(
        Program.member_id == member_id,
        Program.coach_name == coach_name,
        Program.is_active == True
    ).all()
    for prog in programs:
        prog.is_active = False
    db.commit()
    return len(programs)


def cancel_member_sessions_with_coach(db: Session, member_id: int, coach_id: int):
    """Cancel all scheduled personal sessions between a member and a coach"""
    sessions = db.query(PersonalSession).filter(
        PersonalSession.client_id == member_id,
        PersonalSession.coach_id == coach_id,
        PersonalSession.status == "scheduled"
    ).all()
    
    for session in sessions:
        session.status = "cancelled"
    
    db.commit()
    return len(sessions)


# ============================================================
# DASHBOARD
# ============================================================

@router.get("/dashboard/stats")
def get_coach_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get coach dashboard statistics"""
    
    if current_user.role == "admin":
        total_clients = db.query(Member).join(User, Member.user_id == User.id).filter(User.gym_id == current_user.gym_id, Member.status == "active").count()
        total_coaches = db.query(User).filter(User.gym_id == current_user.gym_id, User.role == "coach").count()
    else:
        total_clients = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        ).count()
        total_coaches = 1
    
    today = date_type.today()
    upcoming_classes = db.query(Class).filter(
        Class.coach == current_user.name,
        Class.is_active == True,
        Class.gym_id == current_user.gym_id
    ).limit(5).all()
    
    return {
        "total_clients": total_clients,
        "total_coaches": total_coaches,
        "upcoming_classes": len(upcoming_classes),
        "recent_activity": []
    }


# ============================================================
# CLIENT MANAGEMENT
# ============================================================

@router.get("/clients")
def get_my_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get all clients assigned to the current coach with user data loaded"""
    
    if current_user.role == "admin":
        clients = db.query(Member).options(joinedload(Member.user)).join(User, Member.user_id == User.id).filter(User.gym_id == current_user.gym_id, Member.status == "active").all()
        return clients
    else:
        coach_clients = db.query(CoachClient).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved"
        ).all()
        
        client_ids = [cc.client_id for cc in coach_clients]
        clients = db.query(Member).options(joinedload(Member.user)).filter(Member.id.in_(client_ids)).all()
        return clients


@router.get("/clients/pending")
def get_pending_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get pending client requests for the current coach"""
    
    if current_user.role == "admin":
        coach_clients = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.status == "pending",
            User.gym_id == current_user.gym_id
        ).all()
    else:
        coach_clients = db.query(CoachClient).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.status == "pending"
        ).all()
    
    result = []
    for cc in coach_clients:
        member = db.query(Member).options(joinedload(Member.user)).filter(Member.id == cc.client_id).first()
        coach = db.query(User).filter(User.id == cc.coach_id).first()
        if member:
            result.append({
                "id": cc.id,
                "coach_id": cc.coach_id,
                "coach_name": coach.name if coach else "Unknown",
                "client_id": cc.client_id,
                "client_name": member.user.name if member.user else "Unknown",
                "client_email": member.user.email if member.user else "Unknown",
                "assigned_date": cc.assigned_date,
                "status": cc.status
            })
    
    return result


@router.get("/clients/{client_id}")
def get_client_detail_simple(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get detailed info about a specific client with user data loaded"""
    
    if current_user.role == "coach":
        coach_client = db.query(CoachClient).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.client_id == client_id,
            CoachClient.is_active == True,
            CoachClient.status == "approved"
        ).first()
        
        if not coach_client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    
    member = db.query(Member).options(joinedload(Member.user)).filter(Member.id == client_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return member


@router.post("/clients/assign")
def assign_client_to_coach(
    client_id: int,
    coach_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """ADMIN: Assign a client to a coach"""
    
    client = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == client_id, User.gym_id == current_user.gym_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    coach = db.query(User).filter(User.id == coach_id, User.role == "coach", User.gym_id == current_user.gym_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    existing = db.query(CoachClient).filter(
        CoachClient.coach_id == coach_id,
        CoachClient.client_id == client_id
    ).first()
    
    if existing:
        if existing.status == "approved" and existing.is_active == True:
            raise HTTPException(status_code=400, detail="Client already assigned to this coach")
        elif existing.status == "approved" and existing.is_active == False:
            existing.is_active = True
            existing.status = "approved"
            existing.assigned_date = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            programs = db.query(Program).filter(
                Program.member_id == client_id,
                Program.coach_name == coach.name,
                Program.is_active == False
            ).all()
            for prog in programs:
                prog.is_active = True
            
            notification = Notification(
                user_id=coach_id,
                title="Client Re-assigned",
                message=f"{client.user.name} has been re-assigned to you.",
                type="info",
                is_read=False
            )
            db.add(notification)
            
            member_notification = Notification(
                member_id=client_id,
                title="Coach Re-assigned",
                message=f"You have been re-assigned to Coach {coach.name}.",
                type="success",
                is_read=False
            )
            db.add(member_notification)
            db.commit()
            
            return {
                "message": f"Client re-assigned to coach successfully.",
                "assignment": existing,
                "status": "approved"
            }
        elif existing.status == "pending":
            raise HTTPException(status_code=400, detail="Client already has a pending request with this coach")
        elif existing.status == "declined":
            existing.status = "pending"
            existing.is_active = True
            existing.assigned_date = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            notification = Notification(
                user_id=coach_id,
                title="New Client Assignment Request (Re-submitted)",
                message=f"{client.user.name} has been re-assigned to you by admin. Please review and approve.",
                type="info",
                is_read=False
            )
            db.add(notification)
            
            member_notification = Notification(
                member_id=client_id,
                title="Coach Assignment Request Re-sent",
                message=f"You have been re-assigned to Coach {coach.name}. Waiting for their approval.",
                type="info",
                is_read=False
            )
            db.add(member_notification)
            db.commit()
            
            return {
                "message": f"Client re-assigned to coach successfully. Waiting for coach approval.",
                "assignment": existing,
                "status": "pending"
            }
        else:
            existing.status = "pending"
            existing.is_active = True
            existing.assigned_date = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            notification = Notification(
                user_id=coach_id,
                title="New Client Assignment Request",
                message=f"{client.user.name} has been assigned to you by admin. Please review and approve.",
                type="info",
                is_read=False
            )
            db.add(notification)
            
            member_notification = Notification(
                member_id=client_id,
                title="Coach Assignment Request Sent",
                message=f"You have been assigned to Coach {coach.name}. Waiting for their approval.",
                type="info",
                is_read=False
            )
            db.add(member_notification)
            db.commit()
            
            return {
                "message": f"Client assigned to coach successfully. Waiting for coach approval.",
                "assignment": existing,
                "status": "pending"
            }
    
    assignment = CoachClient(
        coach_id=coach_id,
        client_id=client_id,
        assigned_date=datetime.utcnow(),
        is_active=True,
        status="pending"
    )
    db.add(assignment)
    db.flush()
    
    notification = Notification(
        user_id=coach_id,
        title="New Client Assignment Request",
        message=f"{client.user.name} has been assigned to you by admin. Please review and approve.",
        type="info",
        is_read=False
    )
    db.add(notification)
    
    member_notification = Notification(
        member_id=client_id,
        title="Coach Assignment Request Sent",
        message=f"You have been assigned to Coach {coach.name}. Waiting for their approval.",
        type="info",
        is_read=False
    )
    db.add(member_notification)
    
    db.commit()
    
    return {
        "message": f"Client assigned to coach successfully. Waiting for coach approval.",
        "assignment": assignment,
        "status": "pending"
    }


@router.post("/clients/approve/{assignment_id}")
def approve_client_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """COACH/ADMIN: Approve a client assignment request"""
    
    assignment = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(CoachClient.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if current_user.role == "coach" and assignment.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't own this assignment")
    
    if assignment.status != "pending":
        raise HTTPException(status_code=400, detail=f"Assignment is already {assignment.status}")
    
    assignment.status = "approved"
    assignment.is_active = True
    db.commit()
    db.refresh(assignment)
    
    member = db.query(Member).filter(Member.id == assignment.client_id).first()
    coach = db.query(User).filter(User.id == assignment.coach_id).first()
    
    # No program is auto-assigned here. The coach must explicitly
    # create/assign a program for this specific member from their
    # Programs page — nothing gets copied or shared automatically.
    if member and coach:
        member_notification = Notification(
            member_id=member.id,
            title="Coach Assignment Approved!",
            message=f"Coach {coach.name} has approved your assignment.",
            type="success",
            is_read=False
        )
        db.add(member_notification)
        db.commit()
    
    return {
        "message": "Client assignment approved successfully",
        "assignment": assignment,
        "status": "approved"
    }


@router.post("/clients/decline/{assignment_id}")
def decline_client_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """COACH/ADMIN: Decline a client assignment request"""
    
    assignment = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(CoachClient.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if current_user.role == "coach" and assignment.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't own this assignment")
    
    if assignment.status != "pending":
        raise HTTPException(status_code=400, detail=f"Assignment is already {assignment.status}")
    
    assignment.status = "declined"
    assignment.is_active = False
    db.commit()
    db.refresh(assignment)
    
    member = db.query(Member).filter(Member.id == assignment.client_id).first()
    coach = db.query(User).filter(User.id == assignment.coach_id).first()
    
    if member and coach:
        member_notification = Notification(
            member_id=member.id,
            title="Coach Assignment Declined",
            message=f"Coach {coach.name} has declined your assignment request. Please try another coach.",
            type="warning",
            is_read=False
        )
        db.add(member_notification)
        db.commit()
    
    return {
        "message": "Client assignment declined",
        "assignment": assignment,
        "status": "declined"
    }


@router.delete("/clients/{client_id}/unassign")
def unassign_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Unassign a client from their coach (Admin only)"""
    
    assignment = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
        CoachClient.client_id == client_id,
        CoachClient.is_active == True,
        CoachClient.status == "approved",
        User.gym_id == current_user.gym_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Active assignment not found")
    
    coach = db.query(User).filter(User.id == assignment.coach_id).first()
    coach_name = coach.name if coach else None
    coach_id = coach.id if coach else None
    member = db.query(Member).filter(Member.id == client_id).first()
    
    # Remove program
    if coach_name:
        programs = db.query(Program).filter(
            Program.member_id == client_id,
            Program.coach_name == coach_name,
            Program.is_active == True
        ).all()
        for prog in programs:
            prog.is_active = False
    
    # Cancel all scheduled sessions
    if coach_id:
        cancel_member_sessions_with_coach(db, client_id, coach_id)
    
    assignment.is_active = False
    assignment.status = "declined"
    db.commit()
    
    # Notify the member
    if member:
        notification = Notification(
            member_id=client_id,
            title="Coach Removed by Admin",
            message=f"Your coach {coach_name if coach_name else 'has been'} has been unassigned by admin. Your program and all sessions have been removed.",
            type="info",
            is_read=False
        )
        db.add(notification)
    
    # Notify the coach
    if coach_id and member:
        coach_notification = Notification(
            user_id=coach_id,
            title="Client Removed by Admin",
            message=f"{member.user.name} has been unassigned from you by admin.",
            type="info",
            is_read=False
        )
        db.add(coach_notification)
    
    db.commit()
    
    return {"message": "Client unassigned successfully. All sessions have been cancelled."}


# ============================================================
# MEMBER SELF-ASSIGNMENT
# ============================================================

@router.get("/my-coach")
def get_my_coach(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the coach assigned to the current member (approved or pending)"""
    
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    assignment = db.query(CoachClient).filter(
        CoachClient.client_id == member.id,
        CoachClient.is_active == True,
        CoachClient.status == "approved"
    ).first()
    
    if assignment:
        coach = db.query(User).filter(User.id == assignment.coach_id).first()
        return {
            "has_coach": True,
            "status": "approved",
            "coach": {"id": coach.id, "name": coach.name, "email": coach.email}
        }
    
    pending = db.query(CoachClient).filter(
        CoachClient.client_id == member.id,
        CoachClient.status == "pending"
    ).first()
    
    if pending:
        coach = db.query(User).filter(User.id == pending.coach_id).first()
        return {
            "has_coach": False,
            "status": "pending",
            "coach": {"id": coach.id, "name": coach.name, "email": coach.email}
        }
    
    return {"has_coach": False, "status": None, "coach": None}


@router.get("/available")
def get_available_coaches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available coaches for members to choose from"""
    
    coaches = db.query(User).filter(User.role == "coach", User.is_active == True, User.gym_id == current_user.gym_id).all()
    
    result = []
    for coach in coaches:
        client_count = db.query(CoachClient).filter(
            CoachClient.coach_id == coach.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved"
        ).count()
        
        staff_profile = db.query(Staff).filter(Staff.user_id == coach.id).first()
        
        availability = db.query(CoachAvailability).filter(
            CoachAvailability.coach_id == coach.id,
            CoachAvailability.is_available == True
        ).all()
        
        result.append({
            "id": coach.id,
            "name": coach.name,
            "email": coach.email,
            "specialty": staff_profile.specialty if staff_profile else "General Fitness",
            "bio": staff_profile.bio if staff_profile else "",
            "experience": staff_profile.experience if staff_profile else "0",
            "certifications": staff_profile.certifications if staff_profile else None,
            "achievements": staff_profile.achievements if staff_profile else None,
            "avatar": staff_profile.avatar if staff_profile else None,
            "rating": staff_profile.rating if staff_profile and staff_profile.rating else 0,
            "client_count": client_count,
            "availability": [
                {
                    "day": av.day_of_week,
                    "start": av.start_time,
                    "end": av.end_time
                }
                for av in availability
            ]
        })
    
    return result


@router.post("/assign-self/{coach_id}")
def assign_member_to_coach(
    coach_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Member assigns themselves to a coach"""
    
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    coach = db.query(User).filter(User.id == coach_id, User.role == "coach", User.gym_id == current_user.gym_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    existing = db.query(CoachClient).filter(
        CoachClient.coach_id == coach_id,
        CoachClient.client_id == member.id
    ).first()
    
    if existing:
        if existing.status == "approved" and existing.is_active == True:
            raise HTTPException(status_code=400, detail="You are already assigned to this coach")
        elif existing.status == "approved" and existing.is_active == False:
            existing.is_active = True
            existing.status = "approved"
            existing.assigned_date = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            programs = db.query(Program).filter(
                Program.member_id == member.id,
                Program.coach_name == coach.name,
                Program.is_active == False
            ).all()
            for prog in programs:
                prog.is_active = True
            
            member_notification = Notification(
                member_id=member.id,
                title="Coach Re-assigned",
                message=f"You have been re-assigned to Coach {coach.name}.",
                type="success",
                is_read=False
            )
            db.add(member_notification)
            db.commit()
            
            return {
                "message": f"You have been re-assigned to Coach {coach.name}.",
                "assignment": existing,
                "status": "approved"
            }
        elif existing.status == "pending":
            return {
                "message": f"You already have a pending request with Coach {coach.name}. Waiting for approval.",
                "assignment": existing,
                "status": "pending"
            }
        elif existing.status == "declined":
            existing.status = "pending"
            existing.is_active = True
            existing.assigned_date = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            notification = Notification(
                user_id=coach_id,
                title="New Client Request (Re-submitted)",
                message=f"{member.user.name} wants to be your client again. Please review and approve.",
                type="info",
                is_read=False
            )
            db.add(notification)
            
            member_notification = Notification(
                member_id=member.id,
                title="Coach Request Re-sent",
                message=f"Your request to Coach {coach.name} has been re-sent. Waiting for their approval.",
                type="info",
                is_read=False
            )
            db.add(member_notification)
            db.commit()
            
            return {
                "message": f"Your request has been re-sent to Coach {coach.name}. Waiting for approval.",
                "assignment": existing,
                "status": "pending"
            }
        else:
            existing.status = "pending"
            existing.is_active = True
            existing.assigned_date = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            
            notification = Notification(
                user_id=coach_id,
                title="New Client Request",
                message=f"{member.user.name} wants to be your client. Please review and approve.",
                type="info",
                is_read=False
            )
            db.add(notification)
            
            member_notification = Notification(
                member_id=member.id,
                title="Coach Request Sent",
                message=f"Your request to Coach {coach.name} has been sent. Waiting for their approval.",
                type="info",
                is_read=False
            )
            db.add(member_notification)
            db.commit()
            
            return {
                "message": f"Your request has been sent to Coach {coach.name}. Waiting for approval.",
                "assignment": existing,
                "status": "pending"
            }
    
    assignment = CoachClient(
        coach_id=coach_id,
        client_id=member.id,
        assigned_date=datetime.utcnow(),
        is_active=True,
        status="pending"
    )
    db.add(assignment)
    db.flush()
    
    notification = Notification(
        user_id=coach_id,
        title="New Client Request",
        message=f"{member.user.name} wants to be your client. Please review and approve.",
        type="info",
        is_read=False
    )
    db.add(notification)
    
    member_notification = Notification(
        member_id=member.id,
        title="Coach Request Sent",
        message=f"Your request to Coach {coach.name} has been sent. Waiting for their approval.",
        type="info",
        is_read=False
    )
    db.add(member_notification)
    
    db.commit()
    
    return {
        "message": f"Your request has been sent to Coach {coach.name}. Waiting for approval.",
        "assignment": assignment,
        "status": "pending"
    }


@router.delete("/unassign-self")
def unassign_member_from_coach(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Member unassigns themselves from their current coach"""
    
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    assignment = db.query(CoachClient).filter(
        CoachClient.client_id == member.id,
        CoachClient.is_active == True,
        CoachClient.status == "approved"
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="You don't have an active coach assigned")
    
    coach = db.query(User).filter(User.id == assignment.coach_id).first()
    coach_name = coach.name if coach else None
    coach_id = coach.id if coach else None
    
    # Remove program from member
    if coach_name:
        programs = db.query(Program).filter(
            Program.member_id == member.id,
            Program.coach_name == coach_name,
            Program.is_active == True
        ).all()
        for prog in programs:
            prog.is_active = False
    
    # Cancel all scheduled sessions with this coach
    if coach_id:
        cancel_member_sessions_with_coach(db, member.id, coach_id)
    
    assignment.is_active = False
    assignment.status = "declined"
    db.commit()
    
    # Send notification to the member
    notification = Notification(
        member_id=member.id,
        title="Coach Removed",
        message=f"You have successfully removed {coach_name if coach_name else 'your coach'}. Your program and all scheduled sessions have been removed.",
        type="info",
        is_read=False
    )
    db.add(notification)
    
    # Also notify the coach that the member removed them
    if coach_id:
        coach_notification = Notification(
            user_id=coach_id,
            title="Client Removed You",
            message=f"{member.user.name} has removed you as their coach.",
            type="info",
            is_read=False
        )
        db.add(coach_notification)
    
    db.commit()
    
    return {"message": "You have been unassigned from your coach. All sessions have been cancelled."}


# ============================================================
# COACH CLEANUP - DELETE COACH AND CLEAN UP ALL ASSIGNMENTS
# ============================================================

@router.delete("/cleanup/{coach_id}")
def cleanup_coach(
    coach_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    ADMIN: Clean up a coach - deactivate all assignments, programs, and sessions
    This should be called BEFORE deleting a coach user
    """
    
    coach = db.query(User).filter(User.id == coach_id, User.role == "coach", User.gym_id == admin.gym_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    # Find all active assignments for this coach
    assignments = db.query(CoachClient).filter(
        CoachClient.coach_id == coach_id,
        CoachClient.status == "approved",
        CoachClient.is_active == True
    ).all()
    
    cleaned_count = 0
    
    for assignment in assignments:
        member = db.query(Member).filter(Member.id == assignment.client_id).first()
        
        # Remove programs
        programs = db.query(Program).filter(
            Program.member_id == assignment.client_id,
            Program.coach_name == coach.name,
            Program.is_active == True
        ).all()
        for prog in programs:
            prog.is_active = False
        
        # Cancel all scheduled sessions
        cancel_member_sessions_with_coach(db, assignment.client_id, coach_id)
        
        # Deactivate assignment
        assignment.is_active = False
        assignment.status = "declined"
        cleaned_count += 1
        
        # Notify the member
        if member:
            notification = Notification(
                member_id=assignment.client_id,
                title="Coach Removed from System",
                message=f"Your coach {coach.name} has been removed from the system. Your program and all sessions have been removed.",
                type="warning",
                is_read=False
            )
            db.add(notification)
    
    db.commit()
    
    return {
        "message": f"Cleaned up {cleaned_count} assignments for coach {coach.name}",
        "assignments_cleaned": cleaned_count,
        "coach_id": coach_id
    }


@router.get("/{coach_id}/availability")
def get_coach_availability(
    coach_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get availability for a specific coach"""
    
    coach = db.query(User).filter(User.id == coach_id, User.role == "coach", User.gym_id == current_user.gym_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    
    availability = db.query(CoachAvailability).filter(
        CoachAvailability.coach_id == coach_id,
        CoachAvailability.is_available == True
    ).all()
    
    return [
        {
            "day": av.day_of_week,
            "start": av.start_time,
            "end": av.end_time
        }
        for av in availability
    ]


# ============================================================
# CLIENT PROGRESS TRACKING
# ============================================================

@router.post("/progress")
def add_client_progress(
    data: ClientProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Add progress tracking for a client"""
    
    if current_user.role == "coach":
        coach_client = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.client_id == data.client_id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        ).first()
        
        if not coach_client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    else:
        # Admin must verify client is in their gym
        client = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == data.client_id, User.gym_id == current_user.gym_id).first()
        if not client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    
    progress = ClientProgress(
        client_id=data.client_id,
        coach_id=current_user.id,
        date=data.date or date_type.today(),
        weight=data.weight,
        body_fat=data.body_fat,
        muscle_mass=data.muscle_mass,
        notes=data.notes
    )
    db.add(progress)

    # Keep Member.weight in sync so profile always reflects latest measurement
    if data.weight is not None:
        member = db.query(Member).filter(Member.id == data.client_id).first()
        if member:
            member.weight = data.weight

    db.commit()
    db.refresh(progress)
    
    return progress


@router.get("/progress/trend")
def get_client_progress_trend(
    weeks: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """
    Dashboard "Client Progress Trend": average body-fat % across all of
    the coach's active clients, bucketed by week, for the last `weeks`
    weeks. ClientProgress check-ins are logged manually (weigh-ins),
    not daily, so this buckets by week and only returns weeks that
    actually have at least one logged entry — no fabricated zeros.
    """
    if current_user.role == "admin":
        client_ids = [
            m.id for m in db.query(Member)
            .join(User, Member.user_id == User.id)
            .filter(User.gym_id == current_user.gym_id, Member.status == "active")
            .all()
        ]
    else:
        coach_clients = db.query(CoachClient).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.is_active == True,
            CoachClient.status == "approved"
        ).all()
        client_ids = [cc.client_id for cc in coach_clients]

    if not client_ids:
        return []

    window_start = date_type.today() - timedelta(weeks=weeks)
    entries = db.query(ClientProgress).filter(
        ClientProgress.client_id.in_(client_ids),
        ClientProgress.date >= window_start,
        ClientProgress.body_fat.isnot(None)
    ).order_by(ClientProgress.date).all()

    if not entries:
        return []

    buckets = {}
    for e in entries:
        week_start = e.date - timedelta(days=e.date.weekday())
        buckets.setdefault(week_start, []).append(e.body_fat)

    result = []
    for week_start in sorted(buckets.keys()):
        values = buckets[week_start]
        result.append({
            "week_start": week_start.isoformat(),
            "avg_body_fat": round(sum(values) / len(values), 1),
            "entry_count": len(values)
        })

    return result


@router.get("/progress/{client_id}")
def get_client_progress(
    client_id: int,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get progress history for a client"""
    
    if current_user.role == "coach":
        coach_client = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.client_id == client_id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        ).first()
        
        if not coach_client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    else:
        # Admin must verify client is in their gym
        client = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == client_id, User.gym_id == current_user.gym_id).first()
        if not client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    
    progress = db.query(ClientProgress).filter(
        ClientProgress.client_id == client_id
    ).order_by(ClientProgress.date.desc()).limit(limit).all()
    
    return progress


# ============================================================
# COACH AVAILABILITY
# ============================================================

@router.get("/availability")
def get_my_availability(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get current coach's availability"""
    
    if current_user.role == "admin":
        availability = db.query(CoachAvailability).join(User, CoachAvailability.coach_id == User.id).filter(User.gym_id == current_user.gym_id).all()
    else:
        availability = db.query(CoachAvailability).filter(
            CoachAvailability.coach_id == current_user.id
        ).all()
    
    return availability


@router.post("/availability")
def set_availability(
    data: CoachAvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Set coach availability"""
    
    coach_id = current_user.id
    
    existing = db.query(CoachAvailability).filter(
        CoachAvailability.coach_id == coach_id,
        CoachAvailability.day_of_week == data.day_of_week
    ).first()
    
    if existing:
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.is_available = data.is_available
        db.commit()
        db.refresh(existing)
        return existing
    
    availability = CoachAvailability(
        coach_id=coach_id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        is_available=data.is_available
    )
    db.add(availability)
    db.commit()
    db.refresh(availability)
    
    return availability


@router.put("/availability/{availability_id}")
def update_availability(
    availability_id: int,
    data: CoachAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Update coach availability"""
    
    availability = db.query(CoachAvailability).filter(
        CoachAvailability.id == availability_id
    ).first()
    
    if not availability:
        raise HTTPException(status_code=404, detail="Availability not found")
    
    if current_user.role != "admin" and availability.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if data.is_available is not None:
        availability.is_available = data.is_available
    if data.start_time is not None:
        availability.start_time = data.start_time
    if data.end_time is not None:
        availability.end_time = data.end_time
    
    db.commit()
    db.refresh(availability)
    
    return availability


# ============================================================
# COACH MESSAGES
# ============================================================

@router.post("/messages/send")
def send_message_to_client(
    client_id: int,
    message: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Send a notification/message to a client"""
    
    if current_user.role == "coach":
        coach_client = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.client_id == client_id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        ).first()
        
        if not coach_client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    else:
        # Admin must verify client is in their gym
        client = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == client_id, User.gym_id == current_user.gym_id).first()
        if not client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    
    member = db.query(Member).filter(Member.id == client_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Client not found")
    
    notification = Notification(
        member_id=client_id,
        title=f"Message from Coach {current_user.name}",
        message=message,
        type="info"
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return {"message": "Message sent successfully", "notification_id": notification.id}


# ============================================================
# COMPREHENSIVE CLIENT DETAIL ENDPOINT - FIXED NUTRITION
# ============================================================

@router.get("/clients/{client_id}/detail", response_model=ClientDetailResponse)
def get_client_detail_comprehensive(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get comprehensive client detail for the coach dashboard"""
    
    # Check access
    if current_user.role == "coach":
        coach_client = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.client_id == client_id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        ).first()
        if not coach_client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    else:
        # Admin must verify client is in their gym
        client_check = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == client_id, User.gym_id == current_user.gym_id).first()
        if not client_check:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    
    # Get client with user data
    member = db.query(Member).options(
        joinedload(Member.user),
        joinedload(Member.subscriptions).joinedload(Subscription.plan)
    ).filter(Member.id == client_id).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Client not found")
    
    today = date_type.today()
    
    # ─── 1. SESSIONS ───
    sessions = db.query(PersonalSession).filter(
        PersonalSession.client_id == client_id
    ).order_by(PersonalSession.date.desc()).limit(20).all()
    
    session_data = []
    for s in sessions:
        status_map = {
            "scheduled": "upcoming",
            "completed": "completed",
            "cancelled": "cancelled",
            "pending": "pending",
            "approved": "upcoming"
        }
        # Calculate duration from time strings
        try:
            start_h, start_m = map(int, s.time.split(":"))
            end_h, end_m = map(int, s.end_time.split(":"))
            duration = (end_h * 60 + end_m) - (start_h * 60 + start_m)
        except:
            duration = 60
        
        session_data.append({
            "id": s.id,
            "type": "Personal Training",
            "date": s.date.strftime("%Y-%m-%d"),
            "time": s.time,
            "duration": max(0, duration),
            "status": status_map.get(s.status, "upcoming")
        })
    
    # ─── 2. PROGRAM ───
    program_data = None
    
    # Get active program (coach assigned or member's own)
    active_program = db.query(Program).filter(
        Program.member_id == client_id,
        Program.is_active == True
    ).order_by(Program.created_at.desc()).first()
    
    if active_program:
        # Calculate progress
        total_exercises = 0
        completed_exercises = 0
        weeks_data = []
        
        for week in active_program.weeks:
            week_data = {
                "week_number": week.week_number, 
                "focus": week.focus, 
                "days": []
            }
            for day in week.days:
                day_data = {
                    "day_of_week": day.day_of_week, 
                    "is_rest_day": day.is_rest_day
                }
                exercises = []
                for ex in day.exercises:
                    exercises.append({"name": ex.name, "done": ex.done})
                    total_exercises += 1
                    if ex.done:
                        completed_exercises += 1
                day_data["exercises"] = exercises
                week_data["days"].append(day_data)
            weeks_data.append(week_data)
        
        progress = (completed_exercises / max(total_exercises, 1)) * 100
        
        program_data = {
            "id": active_program.id,
            "name": active_program.name,
            "description": active_program.description,
            "start_date": active_program.start_date,
            "end_date": active_program.end_date,
            "coach_name": active_program.coach_name,
            "is_active": active_program.is_active,
            "progress": round(progress, 1),
            "current_week": len(active_program.weeks) if active_program.weeks else 0,
            "total_weeks": len(active_program.weeks),
            "weeks": weeks_data
        }
    
    # ─── 3. NUTRITION ───
    today = date_type.today()
    week_start = today - timedelta(days=today.weekday())

    meal_plan = db.query(MealPlan).filter(
        MealPlan.member_id == client_id,
        MealPlan.week_start == week_start
    ).first()

    if not meal_plan:
        meal_plan = db.query(MealPlan).filter(
            MealPlan.member_id == client_id
        ).order_by(MealPlan.week_start.desc()).first()

    nutrition_data = {
        "has_plan": False,
        "target_calories": 2000,
        "water_goal": 2.5,
        "days": []
    }

    if meal_plan:
        nutrition_data["has_plan"] = True
        nutrition_data["target_calories"] = meal_plan.daily_calorie_goal or 2000
        nutrition_data["water_goal"] = meal_plan.daily_water_goal or 2.5

        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        all_days = db.query(MealDay).filter(
            MealDay.meal_plan_id == meal_plan.id
        ).all()
        days_by_name = {d.day_of_week: d for d in all_days}

        for day_name in day_names:
            day = days_by_name.get(day_name)
            day_entry = {
                "day": day_name,
                "water": day.water or 0 if day else 0,
                "water_goal": day.water_goal or 2.5 if day else 2.5,
                "meals": [],
                "total_calories": 0,
                "total_protein": 0,
                "total_carbs": 0,
                "total_fat": 0,
            }

            if day:
                meals = db.query(Meal).filter(Meal.day_id == day.id).all()
                for meal in meals:
                    day_entry["meals"].append({
                        "id": meal.id,
                        "name": meal.name,
                        "meal_type": meal.meal_type,
                        "calories": meal.calories or 0,
                        "protein": meal.protein or 0,
                        "carbs": meal.carbs or 0,
                        "fat": meal.fat or 0,
                        "done": meal.done,
                    })
                    day_entry["total_calories"] += meal.calories or 0
                    day_entry["total_protein"] += meal.protein or 0
                    day_entry["total_carbs"] += meal.carbs or 0
                    day_entry["total_fat"] += meal.fat or 0

            nutrition_data["days"].append(day_entry)
    
    # ─── 4. PROGRESS DATA ───
    progress_records = db.query(ClientProgress).filter(
        ClientProgress.client_id == client_id
    ).order_by(ClientProgress.date).limit(20).all()
    
    weight_data = []
    bodyfat_data = []
    muscle_data = []
    
    for pr in progress_records:
        if pr.weight:
            weight_data.append({"date": pr.date.isoformat(), "value": pr.weight})
        if pr.body_fat:
            bodyfat_data.append({"date": pr.date.isoformat(), "value": pr.body_fat})
        if pr.muscle_mass:
            muscle_data.append({"date": pr.date.isoformat(), "value": pr.muscle_mass})

    # Always append Member.weight as today's data point so the chart
    # stays in sync with the member's actual profile weight.
    today_str = today.isoformat()

    if member.weight:
        # Remove any existing entry for today to avoid duplicates, then append
        weight_data = [w for w in weight_data if w["date"] != today_str]
        weight_data.append({"date": today_str, "value": member.weight})
    
    # Attendance rate (last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    attendance_count = db.query(Attendance).filter(
        Attendance.member_id == client_id,
        Attendance.check_in_time >= thirty_days_ago
    ).count()
    attendance_rate = min(100, (attendance_count / 30) * 100) if attendance_count > 0 else 0
    
    progress_data = {
        "weight": weight_data,
        "body_fat": bodyfat_data,
        "muscle_mass": muscle_data,
        "attendance_rate": round(attendance_rate, 1),
        "program_progress": program_data["progress"] if program_data else 0
    }
    
    # ─── 5. NOTES ───
    notes = db.query(ClientNote).filter(
        ClientNote.client_id == client_id
    ).order_by(ClientNote.pinned.desc(), ClientNote.created_at.desc()).all()
    
    note_data = []
    for note in notes:
        note_data.append({
            "id": note.id,
            "text": note.text,
            "created_at": note.created_at,
            "pinned": note.pinned
        })
    
    # ─── 6. PAYMENTS ───
    payments = db.query(Payment).filter(
        Payment.member_id == client_id
    ).order_by(Payment.created_at.desc()).limit(10).all()
    
    payment_data = []
    for i, p in enumerate(payments):
        payment_data.append({
            "id": p.id,
            "invoice_id": f"INV-{str(p.id).zfill(3)}",
            "amount": p.amount,
            "status": p.status,
            "date": p.payment_date.isoformat() if p.payment_date else p.created_at.strftime("%Y-%m-%d"),
            "description": p.notes or f"Payment #{p.id}"
        })
    
    # ─── 7. MEMBERSHIP ───
    membership_plan = None
    active_sub = db.query(Subscription).filter(
        Subscription.member_id == client_id,
        Subscription.status == "active"
    ).first()
    
    if active_sub and active_sub.plan:
        membership_plan = active_sub.plan.name
    
    # ─── 8. STREAK ───
    attendance_records = db.query(Attendance).filter(
        Attendance.member_id == client_id
    ).order_by(Attendance.check_in_time.desc()).all()
    
    streak = 0
    if attendance_records:
        checkin_dates = set()
        for a in attendance_records:
            checkin_dates.add(a.check_in_time.date())
        
        current_date = today
        while current_date in checkin_dates:
            streak += 1
            current_date -= timedelta(days=1)
    
    # ─── 9. NEXT SESSION ───
    next_session = db.query(PersonalSession).filter(
        PersonalSession.client_id == client_id,
        PersonalSession.status.in_(["scheduled", "pending", "approved"]),
        PersonalSession.date >= today
    ).order_by(PersonalSession.date).first()
    
    next_session_data = None
    if next_session:
        next_session_data = {
            "date": next_session.date.strftime("%Y-%m-%d"),
            "time": next_session.time,
            "type": "Personal Training"
        }
    
    # ─── 10. SESSION COUNT ───
    session_count = db.query(PersonalSession).filter(
        PersonalSession.client_id == client_id,
        PersonalSession.status == "completed"
    ).count()
    
    # ─── BUILD RESPONSE ───
    return {
        "id": member.id,
        "user_id": member.user_id,
        "name": member.user.name,
        "email": member.user.email,
        "phone": member.phone,
        "status": member.status,
        "created_at": member.created_at,
        "progress": progress_data["program_progress"],
        "attendance_rate": progress_data["attendance_rate"],
        "streak": streak,
        "session_count": session_count,
        "membership_plan": membership_plan,
        "next_session": next_session_data,
        "sessions": session_data,
        "program": program_data,
        "nutrition": nutrition_data,
        "progress_data": progress_data,
        "notes": note_data,
        "payments": payment_data
    }

# ============================================================
# NOTES ENDPOINTS
# ============================================================

@router.get("/clients/{client_id}/notes", response_model=List[ClientNoteOut])
def get_client_notes(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Get all notes for a client"""
    # Check access
    if current_user.role == "coach":
        coach_client = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.client_id == client_id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        ).first()
        if not coach_client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    else:
        # Admin must verify client is in their gym
        client = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == client_id, User.gym_id == current_user.gym_id).first()
        if not client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    
    notes = db.query(ClientNote).filter(
        ClientNote.client_id == client_id
    ).order_by(ClientNote.pinned.desc(), ClientNote.created_at.desc()).all()
    
    return notes


@router.post("/clients/{client_id}/notes")
def create_client_note(
    client_id: int,
    data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Create a note for a client"""
    # Check access
    if current_user.role == "coach":
        coach_client = db.query(CoachClient).join(User, CoachClient.coach_id == User.id).filter(
            CoachClient.coach_id == current_user.id,
            CoachClient.client_id == client_id,
            CoachClient.is_active == True,
            CoachClient.status == "approved",
            User.gym_id == current_user.gym_id
        ).first()
        if not coach_client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    else:
        # Admin must verify client is in their gym
        client = db.query(Member).join(User, Member.user_id == User.id).filter(Member.id == client_id, User.gym_id == current_user.gym_id).first()
        if not client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
    
    note = ClientNote(
        client_id=client_id,
        coach_id=current_user.id,
        text=data.text,
        pinned=data.pinned
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return {
        "id": note.id,
        "text": note.text,
        "pinned": note.pinned,
        "created_at": note.created_at.isoformat()
    }


@router.put("/notes/{note_id}")
def update_client_note(
    note_id: int,
    data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Update a note"""
    note = db.query(ClientNote).filter(ClientNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if current_user.role == "coach" and note.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't own this note")
    
    if data.text is not None:
        note.text = data.text
    if data.pinned is not None:
        note.pinned = data.pinned
    
    db.commit()
    db.refresh(note)
    
    return {
        "id": note.id,
        "text": note.text,
        "pinned": note.pinned,
        "updated_at": note.updated_at.isoformat()
    }


@router.delete("/notes/{note_id}")
def delete_client_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """Delete a note"""
    note = db.query(ClientNote).filter(ClientNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if current_user.role == "coach" and note.coach_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't own this note")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted"}