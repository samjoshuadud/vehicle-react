from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import get_current_active_user
from typing import List

router = APIRouter(
    prefix="/maintenance",
    tags=["maintenance"]
)

@router.post("/", response_model=schemas.Maintenance)
async def create_maintenance(
    maintenance: schemas.MaintenanceCreate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify vehicle belongs to user
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == maintenance.vehicle_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    db_maintenance = models.Maintenance(**maintenance.model_dump())
    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance

@router.get("/vehicle/{vehicle_id}", response_model=List[schemas.Maintenance])
async def read_vehicle_maintenance(
    vehicle_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify vehicle belongs to user
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == vehicle_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    maintenance_logs = db.query(models.Maintenance).filter(
        models.Maintenance.vehicle_id == vehicle_id
    ).order_by(models.Maintenance.date.desc()).offset(skip).limit(limit).all()
    
    return maintenance_logs

@router.get("/{maintenance_id}", response_model=schemas.Maintenance)
async def read_maintenance(
    maintenance_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    maintenance = db.query(models.Maintenance).join(models.Vehicle).filter(
        models.Maintenance.maintenance_id == maintenance_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance log not found"
        )
    return maintenance

@router.put("/{maintenance_id}", response_model=schemas.Maintenance)
async def update_maintenance(
    maintenance_id: int,
    maintenance_update: schemas.MaintenanceUpdate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    maintenance = db.query(models.Maintenance).join(models.Vehicle).filter(
        models.Maintenance.maintenance_id == maintenance_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance log not found"
        )

    # Update maintenance fields
    for key, value in maintenance_update.model_dump(exclude_unset=True).items():
        setattr(maintenance, key, value)

    db.commit()
    db.refresh(maintenance)
    return maintenance

@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance(
    maintenance_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    maintenance = db.query(models.Maintenance).join(models.Vehicle).filter(
        models.Maintenance.maintenance_id == maintenance_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance log not found"
        )
        
    db.delete(maintenance)
    db.commit()
    return {"ok": True}
