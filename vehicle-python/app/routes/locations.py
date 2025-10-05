"""
Location search endpoint - Proxies Nominatim API requests
Fixes React Native network request issues by handling requests server-side

IMPORTANT: Nominatim Usage Policy
- Maximum 1 request per second
- Must include User-Agent header
- For heavy usage, consider running your own Nominatim instance
"""
from fastapi import APIRouter, HTTPException, Query
import urllib.request
import urllib.parse
import json
import logging
import time
from threading import Lock

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/locations",
    tags=["locations"]
)

# Rate limiting: Nominatim allows max 1 request per second
class RateLimiter:
    def __init__(self, min_interval=1.0):
        self.min_interval = min_interval  # seconds
        self.last_request_time = 0
        self.lock = Lock()
    
    def wait_if_needed(self):
        with self.lock:
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            
            if time_since_last < self.min_interval:
                sleep_time = self.min_interval - time_since_last
                logger.info(f"⏱️ Rate limiting: waiting {sleep_time:.2f}s")
                time.sleep(sleep_time)
            
            self.last_request_time = time.time()

# Global rate limiter for Nominatim API (1 request per second)
nominatim_limiter = RateLimiter(min_interval=1.0)

@router.get("/search")
async def search_location(
    query: str = Query(..., description="Search query for location"),
    country_code: str = Query("ph", description="Country code filter (default: Philippines)")
):
    """
    Search for locations using Nominatim API (OpenStreetMap)
    This endpoint proxies the request to avoid CORS/network issues in React Native
    
    Rate limited to 1 request per second per Nominatim usage policy.
    """
    try:
        logger.info(f"🔍 Searching for location: {query}")
        
        # Apply rate limiting BEFORE making the request
        nominatim_limiter.wait_if_needed()
        
        # Prepare search query
        search_query = query
        if not any(keyword in query.lower() for keyword in ['philippines', 'manila', 'quezon', 'cebu', 'davao']):
            search_query += ', Philippines'
        
        # Build URL with parameters
        params = urllib.parse.urlencode({
            "format": "json",
            "q": search_query,
            "countrycodes": country_code,
            "limit": 15,
            "addressdetails": 1
        })
        
        url = f"https://nominatim.openstreetmap.org/search?{params}"
        
        # Make request with proper User-Agent (required by Nominatim)
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "VehicleMaintenanceApp/1.0 (Educational Project)"}
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                logger.error(f"❌ Nominatim API error: {response.status}")
                raise HTTPException(
                    status_code=response.status,
                    detail=f"Search service returned status {response.status}"
                )
            
            data = json.loads(response.read().decode('utf-8'))
            logger.info(f"✅ Found {len(data)} results")
            
            return {
                "results": data,
                "count": len(data)
            }
            
    except urllib.error.URLError as e:
        logger.error(f"❌ Connection error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to search service"
        )
    except Exception as e:
        logger.error(f"❌ Error searching location: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search location: {str(e)}"
        )
