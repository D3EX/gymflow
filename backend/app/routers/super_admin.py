# backend/app/routers/super_admin.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.models import Gym, User, Member, Staff, SubscriptionTier
from ..utils.auth import require_super_admin, hash_password
from ..tiers import (
    DEFAULT_TIERS_SEED,
    DEFAULT_TIER,
    ensure_tiers_seeded,
    get_tier_by_key,
    get_tier_limits,
)

router = APIRouter(prefix="/api/super-admin", tags=["Super Admin"])


# ============================================================
# GYM SUBSCRIPTION TIERS (super admin's plans FOR gyms)
#
# Not to be confused with the `plans` table / `/api/plans` routes,
# which are the membership plans a gym sells to its OWN members.
# The two never share a table and should never be joined.
# ============================================================

class TierCreate(BaseModel):
    key: str
    name: str
    price: Optional[float] = None
    max_coaches: int
    max_members: int
    features: List[str] = []


class TierUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    max_coaches: Optional[int] = None
    max_members: Optional[int] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None


def _tier_out(tier: SubscriptionTier) -> dict:
    return {
        "id": tier.id,
        "key": tier.key,
        "name": tier.name,
        "price": tier.price,
        "max_coaches": tier.max_coaches,
        "max_members": tier.max_members,
        "features": tier.features or [],
        "is_active": tier.is_active,
    }


@router.get("/tiers")
def list_tiers(db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    """List all gym subscription tiers (super admin's plans for gyms)."""
    ensure_tiers_seeded(db)
    tiers = db.query(SubscriptionTier).order_by(SubscriptionTier.id.asc()).all()
    return [_tier_out(t) for t in tiers]


@router.post("/tiers")
def create_tier(data: TierCreate, db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    if get_tier_by_key(db, data.key):
        raise HTTPException(status_code=400, detail="A tier with this key already exists")

    tier = SubscriptionTier(
        key=data.key,
        name=data.name,
        price=data.price,
        max_coaches=data.max_coaches,
        max_members=data.max_members,
        features=data.features,
    )
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return _tier_out(tier)


@router.put("/tiers/{tier_id}")
def update_tier(
    tier_id: int,
    data: TierUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_super_admin),
):
    tier = db.query(SubscriptionTier).filter(SubscriptionTier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(tier, field, value)

    db.commit()
    db.refresh(tier)
    return _tier_out(tier)


@router.delete("/tiers/{tier_id}")
def delete_tier(tier_id: int, db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    tier = db.query(SubscriptionTier).filter(SubscriptionTier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")

    gyms_using_tier = db.query(Gym).filter(Gym.subscription_tier == tier.key).count()
    if gyms_using_tier > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {gyms_using_tier} gym(s) are currently on this tier",
        )

    db.delete(tier)
    db.commit()
    return {"message": "Tier deleted"}


# ============================================================
# GYMS
# ============================================================

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
        limits = get_tier_limits(db, gym.subscription_tier)

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


@router.post("/gyms")
def create_gym(data: GymCreate, db: Session = Depends(get_db), _admin=Depends(require_super_admin)):
    """Create a new gym + its owner (admin) account in one step."""
    ensure_tiers_seeded(db)
    if not get_tier_by_key(db, data.subscription_tier):
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
    if not get_tier_by_key(db, data.subscription_tier):
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