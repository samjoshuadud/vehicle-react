from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import get_current_active_user
from typing import List

router = APIRouter(
    prefix="/fuel",
    tags=["fuel"]
)

@router.post("/", response_model=schemas.Fuel)
async def create_fuel_log(
    fuel: schemas.FuelCreate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify vehicle belongs to user
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == fuel.vehicle_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    db_fuel = models.Fuel(**fuel.model_dump())
    db.add(db_fuel)
    
    # Update vehicle's current mileage if odometer reading is provided
    if fuel.odometer_reading and fuel.odometer_reading > vehicle.current_mileage:
        vehicle.current_mileage = fuel.odometer_reading
    
    db.commit()
    db.refresh(db_fuel)
    return db_fuel

@router.get("/vehicle/{vehicle_id}", response_model=List[schemas.Fuel])
async def read_vehicle_fuel_logs(
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

    fuel_logs = db.query(models.Fuel).filter(
        models.Fuel.vehicle_id == vehicle_id
    ).order_by(models.Fuel.date.desc()).offset(skip).limit(limit).all()
    
    return fuel_logs

@router.get("/{fuel_id}", response_model=schemas.Fuel)
async def read_fuel_log(
    fuel_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    fuel = db.query(models.Fuel).join(models.Vehicle).filter(
        models.Fuel.fuel_id == fuel_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not fuel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel log not found"
        )
    return fuel

@router.put("/{fuel_id}", response_model=schemas.Fuel)
async def update_fuel_log(
    fuel_id: int,
    fuel_update: schemas.FuelUpdate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    fuel = db.query(models.Fuel).join(models.Vehicle).filter(
        models.Fuel.fuel_id == fuel_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not fuel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel log not found"
        )

    # Update fuel fields
    for key, value in fuel_update.model_dump(exclude_unset=True).items():
        setattr(fuel, key, value)

    # Update vehicle's current mileage if new odometer reading is higher
    if fuel_update.odometer_reading:
        vehicle = db.query(models.Vehicle).filter(
            models.Vehicle.vehicle_id == fuel.vehicle_id
        ).first()
        if fuel_update.odometer_reading > vehicle.current_mileage:
            vehicle.current_mileage = fuel_update.odometer_reading

    db.commit()
    db.refresh(fuel)
    return fuel

@router.delete("/{fuel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fuel_log(
    fuel_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    fuel = db.query(models.Fuel).join(models.Vehicle).filter(
        models.Fuel.fuel_id == fuel_id,
        models.Vehicle.user_id == current_user.user_id
    ).first()
    
    if not fuel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel log not found"
        )
        
    db.delete(fuel)
    db.commit()
    return {"ok": True}
