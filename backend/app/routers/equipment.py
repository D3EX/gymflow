from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.models import Equipment
from ..schemas.schemas import EquipmentCreate, EquipmentUpdate, EquipmentOut
from ..utils.auth import require_admin

router = APIRouter(prefix="/api/equipment", tags=["Equipment"])

@router.get("/", response_model=List[EquipmentOut])
def get_equipment(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    query = db.query(Equipment)
    if category:
        query = query.filter(Equipment.category == category)
    if status:
        query = query.filter(Equipment.status == status)
    return query.all()

@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment_item(equipment_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment

@router.post("/", response_model=EquipmentOut)
def create_equipment(data: EquipmentCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    equipment = Equipment(**data.model_dump())
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment

@router.put("/{equipment_id}", response_model=EquipmentOut)
def update_equipment(equipment_id: int, data: EquipmentUpdate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(equipment, field, val)
    db.commit()
    db.refresh(equipment)
    return equipment

@router.delete("/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(equipment)
    db.commit()
    return {"message": "Equipment deleted"}