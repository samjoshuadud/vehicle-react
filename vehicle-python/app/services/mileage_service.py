"""
Centralized mileage management service for vehicle tracking.
Handles all mileage updates and validation across fuel and maintenance logs.
"""
from sqlalchemy.orm import Session
from app.models import models
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class MileageService:
    """
    Central service for managing vehicle mileage updates.
    Ensures data consistency across all log types.
    """
    
    @staticmethod
    def update_vehicle_mileage(db: Session, vehicle_id: int, new_mileage: Optional[int]) -> Tuple[bool, str]:
        """
        Update vehicle's current mileage if the new mileage is higher.
        
        Args:
            db: Database session
            vehicle_id: ID of the vehicle to update
            new_mileage: New mileage reading (can be None)
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        if not new_mileage or new_mileage <= 0:
            return False, "Invalid mileage value"
            
        try:
            vehicle = db.query(models.Vehicle).filter(
                models.Vehicle.vehicle_id == vehicle_id
            ).first()
            
            if not vehicle:
                return False, "Vehicle not found"
            
            # Only update if new mileage is higher than current
            if new_mileage > (vehicle.current_mileage or 0):
                old_mileage = vehicle.current_mileage
                vehicle.current_mileage = new_mileage
                db.commit()
                
                logger.info(f"Vehicle {vehicle_id} mileage updated from {old_mileage} to {new_mileage}")
                return True, f"Mileage updated to {new_mileage}"
            else:
                return False, f"New mileage ({new_mileage}) is not higher than current ({vehicle.current_mileage})"
                
        except Exception as e:
            logger.error(f"Error updating vehicle mileage: {str(e)}")
            db.rollback()
            return False, f"Database error: {str(e)}"
    
    @staticmethod
    def get_latest_mileage_from_logs(db: Session, vehicle_id: int) -> int:
        """
        Get the highest mileage from all logs (fuel + maintenance).
        Used for data consistency checks and corrections.
        
        Args:
            db: Database session
            vehicle_id: ID of the vehicle
            
        Returns:
            Highest mileage found across all logs
        """
        try:
            # Get highest fuel log mileage
            fuel_max = db.query(models.Fuel.odometer_reading)\
                .filter(models.Fuel.vehicle_id == vehicle_id)\
                .filter(models.Fuel.odometer_reading.isnot(None))\
                .order_by(models.Fuel.odometer_reading.desc())\
                .first()
                
            # Get highest maintenance log mileage
            maintenance_max = db.query(models.Maintenance.mileage)\
                .filter(models.Maintenance.vehicle_id == vehicle_id)\
                .filter(models.Maintenance.mileage.isnot(None))\
                .order_by(models.Maintenance.mileage.desc())\
                .first()
                
            fuel_mileage = fuel_max[0] if fuel_max else 0
            maintenance_mileage = maintenance_max[0] if maintenance_max else 0
            
            return max(fuel_mileage, maintenance_mileage, 0)
            
        except Exception as e:
            logger.error(f"Error getting latest mileage from logs: {str(e)}")
            return 0
    
    @staticmethod
    def sync_vehicle_mileage(db: Session, vehicle_id: int) -> Tuple[bool, str]:
        """
        Sync vehicle's current_mileage with the highest mileage from all logs.
        Used for data correction and migration.
        
        Args:
            db: Database session
            vehicle_id: ID of the vehicle
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            latest_mileage = MileageService.get_latest_mileage_from_logs(db, vehicle_id)
            
            if latest_mileage > 0:
                vehicle = db.query(models.Vehicle).filter(
                    models.Vehicle.vehicle_id == vehicle_id
                ).first()
                
                if not vehicle:
                    return False, "Vehicle not found"
                
                old_mileage = vehicle.current_mileage
                vehicle.current_mileage = latest_mileage
                db.commit()
                
                logger.info(f"Vehicle {vehicle_id} mileage synced from {old_mileage} to {latest_mileage}")
                return True, f"Mileage synced to {latest_mileage}"
            else:
                return False, "No mileage data found in logs"
                
        except Exception as e:
            logger.error(f"Error syncing vehicle mileage: {str(e)}")
            db.rollback()
            return False, f"Sync error: {str(e)}"
    
    @staticmethod
    def validate_mileage_entry(db: Session, vehicle_id: int, new_mileage: Optional[int]) -> Tuple[bool, str, bool]:
        """
        Validate a mileage entry against current vehicle mileage.
        
        Args:
            db: Database session
            vehicle_id: ID of the vehicle
            new_mileage: New mileage to validate
            
        Returns:
            Tuple of (is_valid: bool, message: str, requires_warning: bool)
        """
        if not new_mileage or new_mileage <= 0:
            return False, "Mileage must be a positive number", False
            
        try:
            vehicle = db.query(models.Vehicle).filter(
                models.Vehicle.vehicle_id == vehicle_id
            ).first()
            
            if not vehicle:
                return False, "Vehicle not found", False
            
            current_mileage = vehicle.current_mileage or 0
            
            if new_mileage < current_mileage:
                warning_msg = f"New mileage ({new_mileage}) is lower than current vehicle mileage ({current_mileage}). This might be a mistake."
                return True, warning_msg, True  # Valid but requires warning
            elif new_mileage == current_mileage:
                return True, "Mileage matches current reading", False
            else:
                return True, "Mileage is valid", False
                
        except Exception as e:
            logger.error(f"Error validating mileage: {str(e)}")
            return False, f"Validation error: {str(e)}", False
