# backend/app/routers/staff.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.models import Staff, User, Gym
from ..schemas.schemas import StaffCreate, StaffUpdate, StaffOut
from ..utils.auth import require_admin, hash_password
from ..tiers import get_tier_limits

router = APIRouter(prefix="/api/staff", tags=["Staff"])


def _attach_phone(staff: Staff) -> Staff:
    """phone lives on Staff directly in this schema."""
    return staff


# ============================================================
# LITERAL PATHS FIRST (must come before /{staff_id})
# ============================================================

@router.get("/coaches", response_model=List[StaffOut])
def get_coaches(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get all coaches for the current admin's gym"""
    coaches = (
        db.query(Staff)
        .join(User, Staff.user_id == User.id)
        .filter(User.gym_id == admin.gym_id, Staff.role == "coach")
        .all()
    )
    return coaches


@router.get("/", response_model=List[StaffOut])
def get_staff(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Get all staff for the current admin's gym, optionally filtered by role"""
    query = (
        db.query(Staff)
        .join(User, Staff.user_id == User.id)
        .filter(User.gym_id == admin.gym_id)
    )
    if role:
        query = query.filter(Staff.role == role)
    return query.all()


@router.post("/", response_model=StaffOut)
def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """ADMIN: Create a new staff member (coach, receptionist, manager) in the current gym"""
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Enforce coach limit based on the gym's subscription tier.
    # Only coaches are capped for now — receptionists/managers are uncapped.
    if data.role == "coach":
        gym = db.query(Gym).filter(Gym.id == admin.gym_id).first()
        if not gym:
            raise HTTPException(status_code=400, detail="Admin is not associated with a gym")

        limits = get_tier_limits(gym.subscription_tier)
        current_coach_count = (
            db.query(Staff)
            .join(User, Staff.user_id == User.id)
            .filter(User.gym_id == gym.id, Staff.role == "coach")
            .count()
        )
        if current_coach_count >= limits["max_coaches"]:
            raise HTTPException(
                status_code=403,
                detail=f"Coach limit reached for {gym.subscription_tier} plan "
                       f"({limits['max_coaches']} max). Upgrade your plan to add more coaches."
            )

    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        gym_id=admin.gym_id,
    )
    db.add(user)
    db.flush()

    staff = Staff(
        user_id=user.id,
        role=data.role,
        phone=data.phone,
        specialty=data.specialty,
        bio=data.bio,
        experience=data.experience,
        certifications=data.certifications,
        hire_date=data.hire_date,
        salary=data.salary,
        avatar=data.avatar,
        social_links={
            "instagram": data.instagram,
            "twitter": data.twitter,
            "linkedin": data.linkedin,
            "website": data.website
        }
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


# ============================================================
# PARAMETERIZED PATHS LAST
# ============================================================

@router.get("/{staff_id}", response_model=StaffOut)
def get_staff_member(
    staff_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    staff = (
        db.query(Staff)
        .join(User, Staff.user_id == User.id)
        .filter(Staff.id == staff_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(
    staff_id: int,
    data: StaffUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    staff = (
        db.query(Staff)
        .join(User, Staff.user_id == User.id)
        .filter(Staff.id == staff_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data:
        staff.user.name = update_data.pop("name")

    if any(k in update_data for k in ["instagram", "twitter", "linkedin", "website"]):
        if not staff.social_links:
            staff.social_links = {}
        for key in ["instagram", "twitter", "linkedin", "website"]:
            if key in update_data:
                staff.social_links[key] = update_data.pop(key)

    for field, val in update_data.items():
        setattr(staff, field, val)

    db.commit()
    db.refresh(staff)
    return staff


@router.delete("/{staff_id}")
def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    staff = (
        db.query(Staff)
        .join(User, Staff.user_id == User.id)
        .filter(Staff.id == staff_id, User.gym_id == admin.gym_id)
        .first()
    )
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    user = staff.user
    db.delete(staff)
    db.delete(user)
    db.commit()
    return {"message": "Staff member deleted"}