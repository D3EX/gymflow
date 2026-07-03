from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.models import Equipment, User
from ..schemas.schemas import EquipmentCreate, EquipmentUpdate, EquipmentOut
from ..utils.auth import require_admin

router = APIRouter(prefix="/api/equipment", tags=["Equipment"])

@router.get("/", response_model=List[EquipmentOut])
def get_equipment(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Get all equipment for the admin's gym, optionally filtered by category or status"""
    query = db.query(Equipment).filter(Equipment.gym_id == admin.gym_id)
    if category:
        query = query.filter(Equipment.category == category)
    if status:
        query = query.filter(Equipment.status == status)
    return query.all()


@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment_item(
    equipment_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """Get a specific equipment item (must belong to admin's gym)"""
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id, 
        Equipment.gym_id == admin.gym_id
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.post("/", response_model=EquipmentOut)
def create_equipment(
    data: EquipmentCreate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """Create new equipment for the admin's gym"""
    equipment = Equipment(**data.model_dump(), gym_id=admin.gym_id)
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentOut)
def update_equipment(
    equipment_id: int, 
    data: EquipmentUpdate, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """Update equipment (must belong to admin's gym)"""
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id, 
        Equipment.gym_id == admin.gym_id
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(equipment, field, val)
    
    db.commit()
    db.refresh(equipment)
    return equipment


@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    """Delete equipment (must belong to admin's gym)"""
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id, 
        Equipment.gym_id == admin.gym_id
    ).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    db.delete(equipment)
    db.commit()
    return {"message": "Equipment deleted"}