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
    def _calculate_weighted_average(prices_with_dates):
        """
        Calculate weighted average where more recent prices have higher weight.
        Weight formula: newer prices get exponentially more weight (recency bias).
        
        Args:
            prices_with_dates: List of tuples (price, date)
        
        Returns:
            Weighted average price
        """
        from datetime import datetime
        
        if not prices_with_dates:
            return 0
        
        # Find most recent date
        max_date = max(date for _, date in prices_with_dates)
        
        weighted_sum = 0
        total_weight = 0
        
        for price, date in prices_with_dates:
            # Calculate days difference from most recent
            days_old = (max_date - date).days
            
            # Weight formula: exponential decay (0.85^days_old)
            # Day 0 (today): weight = 1.0
            # Day 1: weight = 0.85
            # Day 2: weight = 0.72
            # Day 3: weight = 0.61
            # Day 7: weight = 0.32
            weight = 0.85 ** days_old
            
            weighted_sum += price * weight
            total_weight += weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0
    
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
        
        # Handle "Unnamed Location (coordinates)" case
        if raw_address.startswith("Unnamed Location ("):
            # Extract coordinates if present
            coord_match = re.search(r'\(([-\d.]+),\s*([-\d.]+)\)', raw_address)
            if coord_match:
                lat, lng = coord_match.groups()
                normalized = f"Station at {lat[:7]}, {lng[:7]}"
            else:
                normalized = "Unnamed Gas Station"
            return {
                "brand": "Gas Station",
                "street": "",
                "normalized": normalized
            }
        
        # Handle old "Location (coordinates)" format
        if raw_address.startswith("Location ("):
            coord_match = re.search(r'\(([-\d.]+),\s*([-\d.]+)\)', raw_address)
            if coord_match:
                lat, lng = coord_match.groups()
                normalized = f"Station at {lat[:7]}, {lng[:7]}"
            else:
                normalized = "Unnamed Gas Station"
            return {
                "brand": "Gas Station",
                "street": "",
                "normalized": normalized
            }
        
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
                "brand": str,
                "fuel_prices": [
                    {
                        "fuel_type": str,
                        "avg_price_per_liter": float,
                        "min_price": float,
                        "max_price": float,
                        "report_count": int
                    }
                ]
            }
        """
        from datetime import datetime, timedelta
        from collections import defaultdict
        
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
            fuel_query = db.query(models.Fuel).join(models.Vehicle).filter(
                models.Fuel.station_cluster_id == cluster.cluster_id,
                models.Fuel.date >= cutoff_date
            )
            
            # Filter by fuel type if specified
            if fuel_type:
                # Use LIKE for partial matching (e.g., "Gasoline" matches "Gasoline (Unleaded)" and "Gasoline (Premium)")
                fuel_query = fuel_query.filter(
                    models.Vehicle.fuel_type.like(f"%{fuel_type}%")
                )
            
            fuel_logs = fuel_query.all()
            
            if not fuel_logs:
                continue
            
            # Group fuel logs by fuel type
            logs_by_fuel_type = defaultdict(list)
            for log in fuel_logs:
                vehicle = db.query(models.Vehicle).filter(
                    models.Vehicle.vehicle_id == log.vehicle_id
                ).first()
                if vehicle and vehicle.fuel_type:
                    logs_by_fuel_type[vehicle.fuel_type].append(log)
            
            # Calculate overall statistics and per-fuel-type statistics
            all_prices = []
            all_prices_with_dates = []  # Store prices with their dates for weighted average
            fuel_prices_array = []
            last_updated = None
            
            for fuel_type_name, type_logs in logs_by_fuel_type.items():
                # Calculate price statistics for this fuel type
                prices_per_liter = []
                prices_with_dates = []
                for log in type_logs:
                    fuel_amount = float(log.liters or log.kwh or 0)
                    if fuel_amount > 0 and log.cost:
                        price_per_liter = float(log.cost) / fuel_amount
                        prices_per_liter.append(price_per_liter)
                        prices_with_dates.append((price_per_liter, log.date))
                
                if not prices_per_liter:
                    continue
                
                # Update overall last_updated
                fuel_type_last_updated = max(log.date for log in type_logs)
                if last_updated is None or fuel_type_last_updated > last_updated:
                    last_updated = fuel_type_last_updated
                
                # Calculate weighted average (recent prices get more weight)
                weighted_avg = LocationService._calculate_weighted_average(prices_with_dates)
                
                # Add to fuel prices array
                fuel_prices_array.append({
                    "fuel_type": fuel_type_name,
                    "avg_price_per_liter": round(weighted_avg, 2),
                    "min_price": round(min(prices_per_liter), 2),
                    "max_price": round(max(prices_per_liter), 2),
                    "report_count": len(prices_per_liter)
                })
                
                # Add to overall prices for station average
                all_prices.extend(prices_per_liter)
                all_prices_with_dates.extend(prices_with_dates)
            
            if not all_prices or not fuel_prices_array:
                continue
            
            # Calculate hours since last update
            hours_since_update = int((datetime.now() - datetime.combine(last_updated, datetime.min.time())).total_seconds() / 3600)
            
            # Calculate weighted overall average
            overall_weighted_avg = LocationService._calculate_weighted_average(all_prices_with_dates)
            
            # Calculate overall statistics
            results.append({
                "cluster_id": cluster.cluster_id,
                "name": cluster.normalized_name,
                "latitude": float(cluster.latitude),
                "longitude": float(cluster.longitude),
                "distance_km": round(distance, 2),
                "avg_price_per_liter": round(overall_weighted_avg, 2),
                "min_price": round(min(all_prices), 2),
                "max_price": round(max(all_prices), 2),
                "report_count": len(all_prices),
                "last_updated": last_updated.isoformat(),
                "hours_since_update": hours_since_update,
                "brand": cluster.brand,
                "fuel_prices": fuel_prices_array  # Array of prices by fuel type
            })
        
        # Sort by distance
        results.sort(key=lambda x: x['distance_km'])
        
        return results
