"""
Location normalization and gas station clustering service.
Handles converting raw addresses into simplified names and grouping nearby stations.
"""
import re
import math
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fuzzywuzzy import fuzz
from app.models import models


class LocationService:
    """Service for normalizing locations and managing gas station clusters."""
    
    # Known gas station brands in the Philippines
    GAS_BRANDS = [
        "Shell", "Petron", "Caltex", "Phoenix", "Seaoil", 
        "PTT", "Total", "Unioil", "Flying V", "Cleanfuel"
    ]
    
    # Clustering threshold in kilometers
    CLUSTER_RADIUS_KM = 0.1  # 100 meters
    NAME_SIMILARITY_THRESHOLD = 80  # 80% similarity for fuzzy matching
    
    @staticmethod
    def normalize_location(raw_address: str) -> Dict[str, str]:
        """
        Extract brand and street from raw address.
        
        Example:
        Input:  "Petron Gas Station, 123 Manuel L. Quezon Avenue, Quezon City, Metro Manila"
        Output: {
            "brand": "Petron",
            "street": "Manuel L. Quezon Avenue",
            "normalized": "Petron, Manuel L. Quezon Avenue"
        }
        """
        if not raw_address:
            return {"brand": "Gas Station", "street": "", "normalized": "Gas Station"}
        
        # Find brand in address
        brand = "Gas Station"
        for gas_brand in LocationService.GAS_BRANDS:
            if gas_brand.lower() in raw_address.lower():
                brand = gas_brand
                break
        
        # Extract street name (split by comma and take relevant parts)
        parts = raw_address.split(',')
        street = ""
        
        if len(parts) >= 2:
            # Usually format is: "Brand, Street, City, Region, Country"
            # Take the second part (street) or first part if no brand
            street_part = parts[1].strip() if brand != "Gas Station" else parts[0].strip()
            
            # Clean up the street name
            # Remove numbers at the start
            street = re.sub(r'^\d+\s*', '', street_part)
            # Remove "Gas Station" text
            street = re.sub(r'gas\s+station', '', street, flags=re.IGNORECASE)
            # Remove extra whitespace
            street = re.sub(r'\s+', ' ', street).strip()
        
        # If no street found, use first part
        if not street and parts:
            street = parts[0].strip()
        
        # Create normalized name (limit to 100 chars)
        if street:
            normalized = f"{brand}, {street}"[:100]
        else:
            normalized = brand
        
        return {
            "brand": brand,
            "street": street,
            "normalized": normalized
        }
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula.
        Returns distance in kilometers.
        """
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def find_or_create_station_cluster(
        db: Session,
        lat: float,
        lng: float,
        normalized_name: str,
        brand: str = None,
        street: str = None
    ) -> str:
        """
        Find existing station cluster within 100m with similar name,
        or create a new cluster.
        
        Returns: cluster_id
        """
        # Find all clusters within cluster radius
        nearby_clusters = db.query(models.GasStationCluster).all()
        
        for cluster in nearby_clusters:
            distance = LocationService.calculate_distance(
                lat, lng,
                float(cluster.latitude), float(cluster.longitude)
            )
            
            # Check if within radius
            if distance <= LocationService.CLUSTER_RADIUS_KM:
                # Check name similarity
                similarity = fuzz.ratio(
                    cluster.normalized_name.lower(),
                    normalized_name.lower()
                )
                
                if similarity >= LocationService.NAME_SIMILARITY_THRESHOLD:
                    # Found matching cluster - update report count
                    cluster.report_count += 1
                    # Update average location (weighted)
                    total_reports = cluster.report_count
                    # Convert Decimal to float before arithmetic
                    current_lat = float(cluster.latitude)
                    current_lng = float(cluster.longitude)
                    cluster.latitude = (
                        (current_lat * (total_reports - 1) + lat) / total_reports
                    )
                    cluster.longitude = (
                        (current_lng * (total_reports - 1) + lng) / total_reports
                    )
                    db.commit()
                    return cluster.cluster_id
        
        # No matching cluster found - create new one
        cluster_id = LocationService._generate_cluster_id(normalized_name, lat, lng)
        
        new_cluster = models.GasStationCluster(
            cluster_id=cluster_id,
            normalized_name=normalized_name,
            latitude=lat,
            longitude=lng,
            brand=brand,
            street=street,
            report_count=1
        )
        
        db.add(new_cluster)
        db.commit()
        
        return cluster_id
    
    @staticmethod
    def _generate_cluster_id(normalized_name: str, lat: float, lng: float) -> str:
        """Generate unique cluster ID from name and coordinates."""
        # Clean name for ID
        clean_name = re.sub(r'[^a-zA-Z0-9]', '_', normalized_name.lower())
        clean_name = re.sub(r'_+', '_', clean_name)[:50]  # Limit length
        
        # Add coordinate hash for uniqueness
        coord_hash = f"{int(lat * 10000)}_{int(lng * 10000)}"
        
        return f"{clean_name}_{coord_hash}"
    
    @staticmethod
    def get_fuel_price_data(
        db: Session,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
        fuel_type: str = None,
        days_back: int = 7
    ) -> list:
        """
        Get aggregated fuel price data for stations near a location.
        
        Args:
            db: Database session
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius in kilometers
            fuel_type: Filter by fuel type (Gasoline/Diesel/Electric)
            days_back: Only include logs from last N days
        
        Returns:
            List of station price data with format:
            {
                "cluster_id": str,
                "name": str,
                "latitude": float,
                "longitude": float,
                "distance_km": float,
                "avg_price_per_liter": float,
                "min_price": float,
                "max_price": float,
                "report_count": int,
                "last_updated": datetime,
                "brand": str
            }
        """
        from datetime import datetime, timedelta
        
        # Calculate date threshold
        cutoff_date = datetime.now().date() - timedelta(days=days_back)
        
        # Get all clusters first
        clusters = db.query(models.GasStationCluster).all()
        
        results = []
        
        for cluster in clusters:
            # Calculate distance
            distance = LocationService.calculate_distance(
                latitude, longitude,
                float(cluster.latitude), float(cluster.longitude)
            )
            
            # Skip if outside radius
            if distance > radius_km:
                continue
            
            # Get fuel logs for this cluster
            fuel_query = db.query(models.Fuel).filter(
                models.Fuel.station_cluster_id == cluster.cluster_id,
                models.Fuel.date >= cutoff_date
            )
            
            # Filter by fuel type if specified
            if fuel_type:
                # Join with vehicle to get fuel_type
                fuel_query = fuel_query.join(models.Vehicle).filter(
                    models.Vehicle.fuel_type == fuel_type
                )
            
            fuel_logs = fuel_query.all()
            
            if not fuel_logs:
                continue
            
            # Calculate price statistics
            prices_per_liter = []
            for log in fuel_logs:
                fuel_amount = float(log.liters or log.kwh or 0)
                if fuel_amount > 0 and log.cost:
                    price_per_liter = float(log.cost) / fuel_amount
                    prices_per_liter.append(price_per_liter)
            
            if not prices_per_liter:
                continue
            
            # Get most recent log date
            last_updated = max(log.date for log in fuel_logs)
            
            results.append({
                "cluster_id": cluster.cluster_id,
                "name": cluster.normalized_name,
                "latitude": float(cluster.latitude),
                "longitude": float(cluster.longitude),
                "distance_km": round(distance, 2),
                "avg_price_per_liter": round(sum(prices_per_liter) / len(prices_per_liter), 2),
                "min_price": round(min(prices_per_liter), 2),
                "max_price": round(max(prices_per_liter), 2),
                "report_count": len(prices_per_liter),
                "last_updated": last_updated.isoformat(),
                "brand": cluster.brand
            })
        
        # Sort by distance
        results.sort(key=lambda x: x['distance_km'])
        
        return results
