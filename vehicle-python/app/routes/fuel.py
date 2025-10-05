from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import get_current_active_user
from ..services.location_service import LocationService
from typing import List
import logging

logger = logging.getLogger(__name__)

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
    try:
        logger.info(f"⛽ Creating fuel log for user {current_user.user_id}")
        logger.info(f"📝 Fuel data received: {fuel.model_dump()}")
        
        # Verify vehicle belongs to user
        vehicle = db.query(models.Vehicle).filter(
            models.Vehicle.vehicle_id == fuel.vehicle_id,
            models.Vehicle.user_id == current_user.user_id
        ).first()
        
        if not vehicle:
            logger.error(f"❌ Vehicle {fuel.vehicle_id} not found for user {current_user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vehicle not found"
            )

        logger.info(f"Creating Fuel object with data: {fuel.model_dump()}")
        
        # Process location data if coordinates are provided
        normalized_location = None
        station_cluster_id = None
        
        if fuel.latitude is not None and fuel.longitude is not None:
            logger.info(f"📍 Processing location: ({fuel.latitude}, {fuel.longitude})")
            
            # Normalize the location name
            if fuel.location:
                location_info = LocationService.normalize_location(fuel.location)
                normalized_location = location_info["normalized"]
                logger.info(f"📝 Normalized location: {normalized_location}")
                
                # Find or create station cluster
                station_cluster_id = LocationService.find_or_create_station_cluster(
                    db=db,
                    lat=float(fuel.latitude),
                    lng=float(fuel.longitude),
                    normalized_name=normalized_location,
                    brand=location_info["brand"],
                    street=location_info["street"]
                )
                logger.info(f"🏪 Station cluster ID: {station_cluster_id}")
        
        # Create fuel log with all data
        fuel_data = fuel.model_dump()
        fuel_data["normalized_location"] = normalized_location
        fuel_data["station_cluster_id"] = station_cluster_id
        
        db_fuel = models.Fuel(**fuel_data)
        logger.info(f"Adding to database...")
        db.add(db_fuel)
        
        logger.info(f"Committing to database...")
        db.commit()
        logger.info(f"Refreshing object...")
        db.refresh(db_fuel)
        logger.info(f"✅ Fuel log created successfully with ID {db_fuel.fuel_id}")
        return db_fuel
    except Exception as e:
        logger.error(f"❌ ERROR creating fuel log: {type(e).__name__}: {str(e)}")
        logger.exception("Full traceback:")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create fuel log: {str(e)}"
        )

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
    try:
        fuel = db.query(models.Fuel).join(models.Vehicle).filter(
            models.Fuel.fuel_id == fuel_id,
            models.Vehicle.user_id == current_user.user_id
        ).first()
        
        if not fuel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fuel log not found"
            )

        # Get the update data
        update_data = fuel_update.model_dump(exclude_unset=True)
        
        # Process location data if coordinates are provided
        if 'latitude' in update_data and 'longitude' in update_data:
            if update_data['latitude'] is not None and update_data['longitude'] is not None:
                logger.info(f"📍 Processing updated location: ({update_data['latitude']}, {update_data['longitude']})")
                
                # Normalize the location name
                if 'location' in update_data and update_data['location']:
                    location_info = LocationService.normalize_location(update_data['location'])
                    update_data['normalized_location'] = location_info["normalized"]
                    logger.info(f"📝 Normalized location: {update_data['normalized_location']}")
                    
                    # Find or create station cluster
                    update_data['station_cluster_id'] = LocationService.find_or_create_station_cluster(
                        db=db,
                        lat=float(update_data['latitude']),
                        lng=float(update_data['longitude']),
                        normalized_name=update_data['normalized_location'],
                        brand=location_info["brand"],
                        street=location_info["street"]
                    )
                    logger.info(f"🏪 Station cluster ID: {update_data['station_cluster_id']}")

        # Update fuel fields
        for key, value in update_data.items():
            setattr(fuel, key, value)

        db.commit()
        db.refresh(fuel)
        logger.info(f"✅ Fuel log {fuel_id} updated successfully")
        return fuel
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ ERROR updating fuel log: {type(e).__name__}: {str(e)}")
        logger.exception("Full traceback:")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update fuel log: {str(e)}"
        )

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
