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
async def get_nearby_fuel_prices(
    latitude: float = Query(..., description="User's latitude"),
    longitude: float = Query(..., description="User's longitude"),
    radius_km: float = Query(5.0, ge=0.1, le=50, description="Search radius in kilometers"),
    fuel_type: Optional[str] = Query(None, description="Filter by fuel type (e.g., 'Gasoline 91', 'Diesel')"),
    time_window: str = Query("3d", regex="^(today|24h|3d|7d)$", description="Time window: today, 24h, 3d, or 7d"),
    db: Session = Depends(get_db)
):
    """
    Get nearby fuel prices with location clustering.
    Time windows:
    - today: Prices reported today only
    - 24h: Last 24 hours
    - 3d: Last 3 days (recommended default)
    - 7d: Last 7 days (maximum range)
    
    Returns prices with freshness indicators (hours_since_update).
    """
    # Convert time_window to days_back
    time_window_map = {
        "today": 1,
        "24h": 1,
        "3d": 3,
        "7d": 7
    }
    days_back = time_window_map.get(time_window, 3)
    
    # Get clustered fuel prices
    results = LocationService.get_fuel_price_data(
        db=db,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        fuel_type=fuel_type,
        days_back=days_back
    )
    
    # If "today" window and no results, fallback to 24h
    if time_window == "today" and not results:
        results = LocationService.get_fuel_price_data(
            db=db,
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km,
            fuel_type=fuel_type,
            days_back=1
        )
        # Add fallback flag
        for result in results:
            result["is_fallback"] = True
            result["fallback_message"] = "No prices today. Showing last 24 hours."
    
    return {
        "time_window": time_window,
        "days_back": days_back,
        "count": len(results),
        "stations": results
    }
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
