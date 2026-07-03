# backend/app/routers/schedule.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import date, datetime
from ..database import get_db
from ..models.models import User, Member, Class, ClassBooking
from ..schemas.schemas import (
    ClassCreate, ClassUpdate, ClassOut,
    ClassBookingCreate, ClassBookingOut
)
from ..utils.auth import get_current_user, require_admin, require_role

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])


# ============================================================
# ADMIN/COACH ENDPOINTS - CLASS CRUD
# ============================================================

@router.post("/classes", response_model=ClassOut)
def create_class(
    data: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "coach"]))
):
    """
    Create a new class - Admin or Coach can create
    """
    # If coach is creating, force the coach name to be their name
    if current_user.role == "coach":
        data.coach = current_user.name
    
    # Check if coach already has a class at this time
    existing_class = db.query(Class).filter(
        Class.coach == data.coach,
        Class.day_of_week == data.day_of_week,
        Class.is_active == True,
        or_(
            (data.time >= Class.time) & (data.time < Class.end_time),
            (data.end_time > Class.time) & (data.end_time <= Class.end_time),
            (data.time <= Class.time) & (data.end_time >= Class.end_time)
        )
    ).first()
    
    if existing_class:
        raise HTTPException(
            status_code=400,
            detail=f"You already have a class '{existing_class.name}' at {existing_class.time} on {data.day_of_week}"
        )
    
    # Create the class
    cls = Class(
        name=data.name,
        coach=data.coach,
        time=data.time,
        end_time=data.end_time,
        day_of_week=data.day_of_week,
        max_capacity=data.max_capacity or 20,
        location=data.location,
        type=data.type,
        description=data.description,
        is_active=True
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)
    
    return ClassOut(
        id=cls.id,
        name=cls.name,
        coach=cls.coach,
        time=cls.time,
        end_time=cls.end_time,
        day_of_week=cls.day_of_week,
        max_capacity=cls.max_capacity,
        spots_left=cls.max_capacity,
        location=cls.location,
        type=cls.type,
        description=cls.description,
        is_active=cls.is_active,
        created_at=cls.created_at
    )


@router.get("/classes/admin", response_model=List[ClassOut])
def get_all_classes_admin(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get all classes (including inactive)"""
    classes = db.query(Class).order_by(Class.day_of_week, Class.time).all()
    
    result = []
    for cls in classes:
        booking_count = db.query(ClassBooking).filter(
            ClassBooking.class_id == cls.id,
            ClassBooking.status == "active"
        ).count()
        
        result.append(ClassOut(
            id=cls.id,
            name=cls.name,
            coach=cls.coach,
            time=cls.time,
            end_time=cls.end_time,
            day_of_week=cls.day_of_week,
            max_capacity=cls.max_capacity,
            spots_left=max(0, cls.max_capacity - booking_count),
            location=cls.location,
            type=cls.type,
            description=cls.description,
            is_active=cls.is_active,
            created_at=cls.created_at
        ))
    
    return result


@router.get("/classes/coach", response_model=List[ClassOut])
def get_coach_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """
    Get classes for the current coach
    """
    if current_user.role == "admin":
        classes = db.query(Class).filter(Class.is_active == True).order_by(Class.day_of_week, Class.time).all()
    else:
        classes = db.query(Class).filter(
            Class.coach == current_user.name,
            Class.is_active == True
        ).order_by(Class.day_of_week, Class.time).all()
    
    result = []
    for cls in classes:
        booking_count = db.query(ClassBooking).filter(
            ClassBooking.class_id == cls.id,
            ClassBooking.status == "active"
        ).count()
        
        result.append(ClassOut(
            id=cls.id,
            name=cls.name,
            coach=cls.coach,
            time=cls.time,
            end_time=cls.end_time,
            day_of_week=cls.day_of_week,
            max_capacity=cls.max_capacity,
            spots_left=max(0, cls.max_capacity - booking_count),
            location=cls.location,
            type=cls.type,
            description=cls.description,
            is_active=cls.is_active,
            created_at=cls.created_at
        ))
    
    return result


@router.put("/classes/{class_id}", response_model=ClassOut)
def update_class(
    class_id: int,
    data: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "coach"]))
):
    """
    Update a class - Admin can update any, Coach can update their own
    """
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check permission: coaches can only edit their own classes
    if current_user.role == "coach" and cls.coach != current_user.name:
        raise HTTPException(status_code=403, detail="You can only edit your own classes")
    
    # Get the coach name (use existing or new)
    coach_name = data.coach or cls.coach
    
    # If coach is updating, force the coach name to be their name
    if current_user.role == "coach":
        coach_name = current_user.name
    
    # Check for conflicts if time or day is being changed
    if data.time or data.end_time or data.day_of_week:
        check_time = data.time or cls.time
        check_end_time = data.end_time or cls.end_time
        check_day = data.day_of_week or cls.day_of_week
        
        existing_class = db.query(Class).filter(
            Class.id != class_id,
            Class.coach == coach_name,
            Class.day_of_week == check_day,
            Class.is_active == True,
            or_(
                (check_time >= Class.time) & (check_time < Class.end_time),
                (check_end_time > Class.time) & (check_end_time <= Class.end_time),
                (check_time <= Class.time) & (check_end_time >= Class.end_time)
            )
        ).first()
        
        if existing_class:
            raise HTTPException(
                status_code=400,
                detail=f"You already have a class '{existing_class.name}' at {existing_class.time} on {check_day}"
            )
    
    # Update fields
    if data.name is not None:
        cls.name = data.name
    if data.coach is not None:
        cls.coach = coach_name
    if data.day_of_week is not None:
        cls.day_of_week = data.day_of_week
    if data.time is not None:
        cls.time = data.time
    if data.end_time is not None:
        cls.end_time = data.end_time
    if data.max_capacity is not None:
        cls.max_capacity = data.max_capacity
    if data.location is not None:
        cls.location = data.location
    if data.type is not None:
        cls.type = data.type
    if data.description is not None:
        cls.description = data.description
    if data.is_active is not None:
        cls.is_active = data.is_active
    
    db.commit()
    db.refresh(cls)
    
    booking_count = db.query(ClassBooking).filter(
        ClassBooking.class_id == cls.id,
        ClassBooking.status == "active"
    ).count()
    
    return ClassOut(
        id=cls.id,
        name=cls.name,
        coach=cls.coach,
        time=cls.time,
        end_time=cls.end_time,
        day_of_week=cls.day_of_week,
        max_capacity=cls.max_capacity,
        spots_left=max(0, cls.max_capacity - booking_count),
        location=cls.location,
        type=cls.type,
        description=cls.description,
        is_active=cls.is_active,
        created_at=cls.created_at
    )


@router.delete("/classes/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "coach"]))
):
    """
    Delete a class - Admin can delete any, Coach can delete their own
    """
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check permission: coaches can only delete their own classes
    if current_user.role == "coach" and cls.coach != current_user.name:
        raise HTTPException(status_code=403, detail="You can only delete your own classes")
    
    db.delete(cls)
    db.commit()
    return {"message": "Class deleted successfully"}


# ============================================================
# MEMBER ENDPOINTS - CLASSES
# ============================================================

@router.get("/classes", response_model=List[ClassOut])
def get_classes(
    day_of_week: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get all available classes with real-time booking count
    """
    query = db.query(Class).filter(Class.is_active == True)
    
    if day_of_week:
        query = query.filter(Class.day_of_week == day_of_week)
    
    classes = query.order_by(Class.day_of_week, Class.time).all()
    
    result = []
    for cls in classes:
        booking_count = db.query(ClassBooking).filter(
            ClassBooking.class_id == cls.id,
            ClassBooking.status == "active"
        ).count()
        
        spots_left = max(0, cls.max_capacity - booking_count)
        
        result.append(ClassOut(
            id=cls.id,
            name=cls.name,
            coach=cls.coach,
            time=cls.time,
            end_time=cls.end_time,
            day_of_week=cls.day_of_week,
            max_capacity=cls.max_capacity,
            spots_left=spots_left,
            location=cls.location,
            type=cls.type,
            description=cls.description,
            is_active=cls.is_active,
            created_at=cls.created_at
        ))
    
    return result


@router.get("/classes/{class_id}", response_model=ClassOut)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get a single class with booking count"""
    cls = db.query(Class).filter(Class.id == class_id, Class.is_active == True).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    booking_count = db.query(ClassBooking).filter(
        ClassBooking.class_id == cls.id,
        ClassBooking.status == "active"
    ).count()
    
    spots_left = max(0, cls.max_capacity - booking_count)
    
    return ClassOut(
        id=cls.id,
        name=cls.name,
        coach=cls.coach,
        time=cls.time,
        end_time=cls.end_time,
        day_of_week=cls.day_of_week,
        max_capacity=cls.max_capacity,
        spots_left=spots_left,
        location=cls.location,
        type=cls.type,
        description=cls.description,
        is_active=cls.is_active,
        created_at=cls.created_at
    )


# ============================================================
# BOOKINGS ENDPOINTS - ✅ ADD THIS
# ============================================================

@router.get("/classes/{class_id}/bookings")
def get_class_bookings(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all bookings for a specific class
    """
    # Check if class exists
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # For coaches: only allow if they own the class
    if current_user.role == "coach" and cls.coach != current_user.name:
        raise HTTPException(status_code=403, detail="You can only view bookings for your own classes")
    
    # Get bookings
    bookings = db.query(ClassBooking).filter(
        ClassBooking.class_id == class_id,
        ClassBooking.status == "active"
    ).all()
    
    result = []
    for booking in bookings:
        member = db.query(Member).filter(Member.id == booking.member_id).first()
        result.append({
            "id": booking.id,
            "member_id": booking.member_id,
            "member_name": member.user.name if member else "Unknown",
            "booked_at": booking.booked_at,
            "status": booking.status
        })
    
    return result


# ============================================================
# MEMBER ENDPOINTS - BOOKINGS
# ============================================================

@router.get("/my-bookings", response_model=List[ClassBookingOut])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get current member's class bookings
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return []
    
    bookings = db.query(ClassBooking).filter(
        ClassBooking.member_id == member.id,
        ClassBooking.status == "active"
    ).order_by(ClassBooking.booked_at.desc()).all()
    
    result = []
    for booking in bookings:
        cls = db.query(Class).filter(Class.id == booking.class_id).first()
        if cls:
            result.append(ClassBookingOut(
                id=booking.id,
                class_id=booking.class_id,
                member_id=booking.member_id,
                booked_at=booking.booked_at,
                status=booking.status,
                class_item=ClassOut(
                    id=cls.id,
                    name=cls.name,
                    coach=cls.coach,
                    time=cls.time,
                    end_time=cls.end_time,
                    day_of_week=cls.day_of_week,
                    max_capacity=cls.max_capacity,
                    spots_left=0,
                    location=cls.location,
                    type=cls.type,
                    description=cls.description,
                    is_active=cls.is_active,
                    created_at=cls.created_at
                )
            ))
    
    return result


@router.post("/classes/{class_id}/book")
def book_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Book a class
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    cls = db.query(Class).filter(Class.id == class_id, Class.is_active == True).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if class is full
    booking_count = db.query(ClassBooking).filter(
        ClassBooking.class_id == class_id,
        ClassBooking.status == "active"
    ).count()
    
    if booking_count >= cls.max_capacity:
        raise HTTPException(status_code=400, detail="Class is full")
    
    # Check if already booked
    existing = db.query(ClassBooking).filter(
        ClassBooking.class_id == class_id,
        ClassBooking.member_id == member.id,
        ClassBooking.status == "active"
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already booked this class")
    
    # Create booking
    booking = ClassBooking(
        class_id=class_id,
        member_id=member.id,
        status="active"
    )
    db.add(booking)
    db.commit()
    
    spots_left = cls.max_capacity - booking_count - 1
    
    return {
        "success": True,
        "message": "Class booked successfully! 🎉",
        "class_id": class_id,
        "class_name": cls.name,
        "spots_left": spots_left
    }


@router.delete("/classes/{class_id}/cancel")
def cancel_booking(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Cancel a class booking
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member profile not found")
    
    booking = db.query(ClassBooking).filter(
        ClassBooking.class_id == class_id,
        ClassBooking.member_id == member.id,
        ClassBooking.status == "active"
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "cancelled"
    db.commit()
    
    return {
        "success": True,
        "message": "Booking cancelled successfully",
        "class_id": class_id
    }


# ============================================================
# ADMIN ENDPOINTS - BOOKINGS
# ============================================================

@router.get("/bookings")
def get_all_bookings(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get all class bookings"""
    bookings = db.query(ClassBooking).order_by(ClassBooking.booked_at.desc()).all()
    
    result = []
    for booking in bookings:
        member = db.query(Member).filter(Member.id == booking.member_id).first()
        cls = db.query(Class).filter(Class.id == booking.class_id).first()
        result.append({
            "id": booking.id,
            "member_name": member.user.name if member else "Unknown",
            "class_name": cls.name if cls else "Unknown",
            "class_time": cls.time if cls else "Unknown",
            "day_of_week": cls.day_of_week if cls else "Unknown",
            "booked_at": booking.booked_at,
            "status": booking.status
        })
    
    return result


@router.get("/bookings/member/{member_id}")
def get_member_bookings_admin(
    member_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get all bookings for a specific member"""
    bookings = db.query(ClassBooking).filter(
        ClassBooking.member_id == member_id
    ).order_by(ClassBooking.booked_at.desc()).all()
    
    result = []
    for booking in bookings:
        cls = db.query(Class).filter(Class.id == booking.class_id).first()
        result.append({
            "id": booking.id,
            "class_name": cls.name if cls else "Unknown",
            "class_time": cls.time if cls else "Unknown",
            "day_of_week": cls.day_of_week if cls else "Unknown",
            "booked_at": booking.booked_at,
            "status": booking.status
        })
    
    return result