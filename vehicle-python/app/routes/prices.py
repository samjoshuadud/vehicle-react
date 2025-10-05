"""
Fuel prices routes - Community-sourced real-time fuel pricing.
Aggregates fuel log data to show current prices at nearby stations.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.services.location_service import LocationService

router = APIRouter(
    prefix="/fuel-prices",
    tags=["Fuel Prices"]
)


@router.get("/nearby")
def get_nearby_fuel_prices(
    latitude: float = Query(..., description="Your current latitude"),
    longitude: float = Query(..., description="Your current longitude"),
    radius_km: float = Query(10.0, ge=1.0, le=50.0, description="Search radius in kilometers (1-50)"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type: Gasoline, Diesel, or Electric"),
    days_back: int = Query(7, ge=1, le=30, description="Include logs from last N days (1-30)"),
    db: Session = Depends(get_db)
):
    """
    Get real-time fuel prices from nearby gas stations based on user-contributed data.
    
    Returns aggregated price data including:
    - Average price per liter/kWh
    - Number of reports
    - Last update time
    - Distance from your location
    
    Prices are calculated from actual fuel logs submitted by users in the area.
    """
    try:
        price_data = LocationService.get_fuel_price_data(
            db=db,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            fuel_type=fuel_type,
            days_back=days_back
        )
        
        return {
            "success": True,
            "location": {
                "latitude": latitude,
                "longitude": longitude
            },
            "search_radius_km": radius_km,
            "fuel_type": fuel_type or "All",
            "days_back": days_back,
            "stations": price_data,
            "total_stations": len(price_data)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching fuel prices: {str(e)}")


@router.get("/statistics")
def get_price_statistics(
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type"),
    db: Session = Depends(get_db)
):
    """
    Get overall fuel price statistics.
    
    Returns:
    - Average price across all stations
    - Cheapest station
    - Most expensive station
    - Price trends
    """
    # This can be expanded later
    return {
        "success": True,
        "message": "Price statistics endpoint - Coming soon!"
    }
