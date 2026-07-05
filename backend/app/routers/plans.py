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
    """Get plans: super_admin sees global platform plans (gym_id IS NULL);
    everyone else sees only their own gym's plans."""
    if current_user.role == "super_admin":
        plans = db.query(Plan).filter(Plan.gym_id.is_(None)).order_by(Plan.price).all()
    else:
        plans = db.query(Plan).filter(Plan.gym_id == current_user.gym_id).order_by(Plan.price).all()
    return plans

@router.post("/", response_model=PlanOut)
def create_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new plan. Super admins create global platform plans
    (gym_id=NULL); regular admins create plans scoped to their own gym."""
    plan_gym_id = None if admin.role == "super_admin" else admin.gym_id
    plan = Plan(**data.dict(), gym_id=plan_gym_id)
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

    if admin.role == "super_admin":
        plan = db.query(Plan).filter(
            Plan.id == plan_id,
            Plan.gym_id.is_(None)
        ).first()
    else:
        plan = db.query(Plan).filter(
            Plan.id == plan_id,
            Plan.gym_id == admin.gym_id
        ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
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
    """Delete a plan (must belong to admin's gym, or be a global plan for super_admin)"""
    if admin.role == "super_admin":
        plan = db.query(Plan).filter(
            Plan.id == plan_id,
            Plan.gym_id.is_(None)
        ).first()
    else:
        plan = db.query(Plan).filter(
            Plan.id == plan_id,
            Plan.gym_id == admin.gym_id
        ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}