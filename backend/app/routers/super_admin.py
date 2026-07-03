# backend/app/routers/super_admin.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.models import Gym, User, Member, Staff
from ..utils.auth import require_super_admin, hash_password
from ..tiers import SUBSCRIPTION_TIERS, get_tier_limits, DEFAULT_TIER

router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])


class GymCreate(BaseModel):
    name: str
    owner_name: str
    owner_email: str
    owner_password: str
    subscription_tier: str = DEFAULT_TIER


class GymTierUpdate(BaseModel):
    subscription_tier: str


@router.get("/gyms")
def list_gyms(db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    """List every gym with current coach/member usage vs their tier limits."""
    gyms = db.query(Gym).order_by(Gym.created_at.desc()).all()
    result = []
    for gym in gyms:
        limits = get_tier_limits(gym.subscription_tier)

        coach_count = (
            db.query(Staff)
            .join(User, Staff.user_id == User.id)
            .filter(User.gym_id == gym.id, Staff.role == "coach")
            .count()
        )
        member_count = (
            db.query(Member)
            .join(User, Member.user_id == User.id)
            .filter(User.gym_id == gym.id)
            .count()
        )

        result.append({
            "id": gym.id,
            "name": gym.name,
            "owner_email": gym.owner_email,
            "subscription_tier": gym.subscription_tier,
            "is_active": gym.is_active,
            "created_at": gym.created_at,
            "coaches": {"used": coach_count, "limit": limits["max_coaches"]},
            "members": {"used": member_count, "limit": limits["max_members"]},
        })
    return result


@router.get("/tiers")
def list_tiers(_admin=Depends(require_super_admin)):
    """Return the hardcoded tier definitions (for a dropdown in the super admin UI)."""
    return SUBSCRIPTION_TIERS


@router.post("/gyms")
def create_gym(data: GymCreate, db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    """Create a new gym + its owner (admin) account in one step."""
    if data.subscription_tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")

    if db.query(User).filter(User.email == data.owner_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    gym = Gym(
        name=data.name,
        owner_email=data.owner_email,
        subscription_tier=data.subscription_tier,
        is_active=True,
    )
    db.add(gym)
    db.flush()  # get gym.id before commit

    owner = User(
        name=data.owner_name,
        email=data.owner_email,
        password=hash_password(data.owner_password),
        role="admin",
        gym_id=gym.id,
    )
    db.add(owner)
    db.commit()
    db.refresh(gym)

    return {"message": "Gym created", "gym_id": gym.id, "owner_id": owner.id}


@router.put("/gyms/{gym_id}/tier")
def update_gym_tier(
    gym_id: int,
    data: GymTierUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_super_admin),
):
    if data.subscription_tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")

    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")

    gym.subscription_tier = data.subscription_tier
    db.commit()
    return {"message": "Tier updated", "gym_id": gym.id, "subscription_tier": gym.subscription_tier}


@router.put("/gyms/{gym_id}/suspend")
def suspend_gym(gym_id: int, db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    gym.is_active = False
    db.commit()
    return {"message": "Gym suspended"}


@router.put("/gyms/{gym_id}/activate")
def activate_gym(gym_id: int, db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    gym = db.query(Gym).filter(Gym.id == gym_id).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    gym.is_active = True
    db.commit()
    return {"message": "Gym activated"}