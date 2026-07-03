# backend/app/routers/plans.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.models import Plan, User
from ..schemas.schemas import PlanCreate, PlanUpdate, PlanOut
from ..utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/plans", tags=["Plans"])

@router.get("/", response_model=List[PlanOut])
def get_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all plans for the current user's gym"""
    plans = db.query(Plan).filter(Plan.gym_id == current_user.gym_id).order_by(Plan.price).all()
    return plans

@router.post("/", response_model=PlanOut)
def create_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new plan for the admin's gym"""
    plan = Plan(**data.dict(), gym_id=admin.gym_id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: int,
    data: PlanUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    print("🔥 RAW INCOMING DATA:", data.dict())          # ADD THIS

    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.gym_id == admin.gym_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(plan, key, value)

    print("🔥 PLAN FEATURES BEFORE COMMIT:", plan.features)   # ADD THIS

    db.commit()
    db.refresh(plan)

    print("🔥 PLAN FEATURES AFTER REFRESH:", plan.features)   # ADD THIS
    return plan
@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Delete a plan (must belong to admin's gym)"""
    plan = db.query(Plan).filter(
        Plan.id == plan_id,
        Plan.gym_id == admin.gym_id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}