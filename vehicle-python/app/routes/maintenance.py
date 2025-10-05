from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import get_current_active_user
from ..services.mileage_service import MileageService
from typing import List
import logging

logger = logging.getLogger(__name__)

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
    try:
        logger.info(f"🔧 Creating maintenance log for user {current_user.user_id}")
        logger.info(f"📝 Maintenance data received: {maintenance.model_dump()}")
        
        # Verify vehicle belongs to user
        vehicle = db.query(models.Vehicle).filter(
            models.Vehicle.vehicle_id == maintenance.vehicle_id,
            models.Vehicle.user_id == current_user.user_id
        ).first()
        
        if not vehicle:
            logger.error(f"❌ Vehicle {maintenance.vehicle_id} not found for user {current_user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found"
            )

        # Create maintenance record
        logger.info(f"Creating Maintenance object with data: {maintenance.model_dump()}")
        db_maintenance = models.Maintenance(**maintenance.model_dump())
        logger.info(f"Adding to database...")
        db.add(db_maintenance)
        
        # 🚗 NEW: Update vehicle mileage using centralized service
        if maintenance.mileage:
            logger.info(f"Updating vehicle mileage to {maintenance.mileage}")
            success, message = MileageService.update_vehicle_mileage(
                db, maintenance.vehicle_id, maintenance.mileage
            )
            if success:
                logger.info(f"Maintenance creation: {message}")
            else:
                logger.warning(f"Mileage update failed during maintenance creation: {message}")
        
        logger.info(f"Committing to database...")
        db.commit()
        logger.info(f"Refreshing object...")
        db.refresh(db_maintenance)
        logger.info(f"✅ Maintenance log created successfully with ID {db_maintenance.maintenance_id}")
        return db_maintenance
    except Exception as e:
        logger.error(f"❌ ERROR creating maintenance log: {type(e).__name__}: {str(e)}")
        logger.exception("Full traceback:")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create maintenance log: {str(e)}"
        )

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

    # 🚗 NEW: Update vehicle mileage if mileage was updated
    if maintenance_update.mileage:
        success, message = MileageService.update_vehicle_mileage(
            db, maintenance.vehicle_id, maintenance_update.mileage
        )
        if success:
            logger.info(f"Maintenance update: {message}")
        else:
            logger.warning(f"Mileage update failed during maintenance update: {message}")

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
    
    vehicle_id = maintenance.vehicle_id
    db.delete(maintenance)
    
    # 🚗 NEW: Recalculate vehicle mileage after deletion
    # This ensures mileage stays accurate even when logs are deleted
    success, message = MileageService.sync_vehicle_mileage(db, vehicle_id)
    if success:
        logger.info(f"Maintenance deletion: {message}")
    else:
        logger.warning(f"Mileage sync failed after maintenance deletion: {message}")
    
    db.commit()
    return {"ok": True}
