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
    current_user: User = Depends(get_current_user)  # ✅ Allow authenticated users
):
    """Get all plans - accessible by authenticated users"""
    plans = db.query(Plan).order_by(Plan.price).all()
    print(f"📋 Returning {len(plans)} plans")  # Debug log
    return plans

@router.post("/", response_model=PlanOut)
def create_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    plan = Plan(**data.dict())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: int,
    data: PlanUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(plan, key, value)
    
    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}