from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import get_current_active_user
from typing import List

router = APIRouter(
    prefix="/vehicles",
    tags=["vehicles"]
)

@router.post("/", response_model=schemas.Vehicle)
async def create_vehicle(
    vehicle: schemas.VehicleCreate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if vehicle.license_plate:
        # Check if license plate is already registered
        existing_vehicle = db.query(models.Vehicle).filter(
            models.Vehicle.license_plate == vehicle.license_plate
        ).first()
        if existing_vehicle:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License plate already registered"
            )

    db_vehicle = models.Vehicle(**vehicle.model_dump(), user_id=current_user.user_id)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.get("/", response_model=List[schemas.Vehicle])
async def read_vehicles(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    vehicles = db.query(models.Vehicle).filter(
        models.Vehicle.user_id == current_user.user_id
    ).offset(skip).limit(limit).all()
    return vehicles

@router.get("/{vehicle_id}", response_model=schemas.Vehicle)
async def read_vehicle(
    vehicle_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == vehicle_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle

@router.put("/{vehicle_id}", response_model=schemas.Vehicle)
async def update_vehicle(
    vehicle_id: int,
    vehicle_update: schemas.VehicleUpdate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == vehicle_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not db_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Update vehicle fields
    for key, value in vehicle_update.model_dump(exclude_unset=True).items():
        setattr(db_vehicle, key, value)

    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == vehicle_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
        
    db.delete(vehicle)
    db.commit()
    return {"ok": True}
