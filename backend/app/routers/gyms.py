# backend/app/routers/gyms.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models.models import Gym

router = APIRouter(prefix="/api/gyms", tags=["Gyms"])


# ============================================================
# PUBLIC SCHEMA — only what's safe to show before login.
# Never expose owner_email, subscription_tier, etc. here.
# ============================================================

class GymPublicOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ============================================================
# GET /api/gyms
# Public list used by the Register page fallback selector
# (when a member lands on /register with no ?gym= param).
# ============================================================

@router.get("", response_model=list[GymPublicOut])
def list_gyms(db: Session = Depends(get_db)):
    gyms = (
        db.query(Gym)
        .filter(Gym.is_active == True)
        .order_by(Gym.name.asc())
        .all()
    )
    return gyms


# ============================================================
# GET /api/gyms/{gym_id}
# Used by /register?gym=12 to confirm the gym exists and show
# its name ("Joining: Iron Temple Gym") before the member fills
# out the form — cheap sanity check against a bad/stale QR code.
# ============================================================

@router.get("/{gym_id}", response_model=GymPublicOut)
def get_gym(gym_id: int, db: Session = Depends(get_db)):
    gym = db.query(Gym).filter(Gym.id == gym_id, Gym.is_active == True).first()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    return gym