# backend/app/routers/staff.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.models import Staff, User
from ..schemas.schemas import StaffCreate, StaffUpdate, StaffOut
from ..utils.auth import require_admin, hash_password

router = APIRouter(prefix="/api/staff", tags=["Staff"])


def _attach_phone(staff: Staff) -> Staff:
    """phone lives on the related User, not on Staff itself.
    StaffOut exposes a flat `phone` field, so we copy it over
    before returning the object for serialization."""
    staff.phone = staff.user.phone if staff.user else None
    return staff


@router.get("/", response_model=List[StaffOut])
def get_staff(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    query = db.query(Staff)
    if role:
        query = query.filter(Staff.role == role)
    return query.all()


@router.get("/coaches", response_model=List[StaffOut])
def get_coaches(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    coaches = db.query(Staff).filter(Staff.role == "coach").all()
    return coaches


@router.get("/{staff_id}", response_model=StaffOut)
def get_staff_member(
    staff_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.post("/", response_model=StaffOut)
def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role
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


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(
    staff_id: int,
    data: StaffUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
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
    admin=Depends(require_admin)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    user = staff.user
    db.delete(staff)
    db.delete(user)
    db.commit()
    return {"message": "Staff member deleted"}

# ============================================================
# GET COACHES
# ============================================================

@router.get("/coaches", response_model=List[StaffOut])
def get_coaches(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get all staff members with role 'coach'"""
    coaches = db.query(Staff).filter(Staff.role == "coach").all()
    return [_attach_phone(c) for c in coaches]


@router.get("/{staff_id}", response_model=StaffOut)
def get_staff_member(
    staff_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return _attach_phone(staff)


@router.post("/", response_model=StaffOut)
def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user account
    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password=hash_password(data.password),
        role=data.role
    )
    db.add(user)
    db.flush()

    # Create staff profile
    staff = Staff(
        user_id=user.id,
        role=data.role,
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
    return _attach_phone(staff)


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(
    staff_id: int,
    data: StaffUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    update_data = data.model_dump(exclude_unset=True)

    # Update user fields
    if "name" in update_data:
        staff.user.name = update_data.pop("name")
    if "phone" in update_data:
        staff.user.phone = update_data.pop("phone")

    # Update social links
    if any(k in update_data for k in ["instagram", "twitter", "linkedin", "website"]):
        if not staff.social_links:
            staff.social_links = {}
        for key in ["instagram", "twitter", "linkedin", "website"]:
            if key in update_data:
                staff.social_links[key] = update_data.pop(key)

    # Update staff fields
    for field, val in update_data.items():
        setattr(staff, field, val)

    db.commit()
    db.refresh(staff)
    return _attach_phone(staff)


@router.delete("/{staff_id}")
def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    user = staff.user
    db.delete(staff)
    db.delete(user)
    db.commit()
    return {"message": "Staff member deleted"}