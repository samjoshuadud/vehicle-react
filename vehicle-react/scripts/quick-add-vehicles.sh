#!/bin/bash

# Quick Mock Vehicle Creator
# Usage: ./scripts/quick-add-vehicle.sh <email> <password>

API_BASE_URL="http://192.168.100.200:8000"

if [ $# -ne 2 ]; then
    echo "Usage: $0 <email> <password>"
    echo "Example: $0 user@example.com mypassword"
    exit 1
fi

EMAIL="$1"
PASSWORD="$2"

echo "🔐 Logging in..."

# Login and get token
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$EMAIL&password=$PASSWORD")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Please check your credentials."
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"

# Array of sample vehicles
declare -a vehicles=(
    '{"make":"Toyota","model":"Camry","year":2022,"color":"Silver","license_plate":"TEST001","current_mileage":15000,"fuel_type":"Gasoline"}'
    '{"make":"Honda","model":"Civic","year":2021,"color":"Blue","license_plate":"TEST002","current_mileage":22000,"fuel_type":"Gasoline"}'
    '{"make":"Tesla","model":"Model 3","year":2023,"color":"White","license_plate":"TEST003","current_mileage":8000,"fuel_type":"Electric"}'
    '{"make":"Ford","model":"F-150","year":2020,"color":"Black","license_plate":"TEST004","current_mileage":45000,"fuel_type":"Gasoline"}'
    '{"make":"BMW","model":"X5","year":2023,"color":"Gray","license_plate":"TEST005","current_mileage":5000,"fuel_type":"Gasoline"}'
)

echo "📝 Adding mock vehicles..."

SUCCESS_COUNT=0
ERROR_COUNT=0

for i in "${!vehicles[@]}"; do
    VEHICLE="${vehicles[$i]}"
    VEHICLE_INFO=$(echo "$VEHICLE" | grep -o '"make":"[^"]*"' | cut -d'"' -f4)
    VEHICLE_MODEL=$(echo "$VEHICLE" | grep -o '"model":"[^"]*"' | cut -d'"' -f4)
    VEHICLE_YEAR=$(echo "$VEHICLE" | grep -o '"year":[0-9]*' | cut -d':' -f2)
    
    echo -n "$((i+1)). Adding $VEHICLE_YEAR $VEHICLE_INFO $VEHICLE_MODEL... "
    
    RESPONSE=$(curl -s -X POST "$API_BASE_URL/vehicles/" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$VEHICLE")
    
    if echo "$RESPONSE" | grep -q '"vehicle_id"'; then
        VEHICLE_ID=$(echo "$RESPONSE" | grep -o '"vehicle_id":[0-9]*' | cut -d':' -f2)
        echo "✅ Success (ID: $VEHICLE_ID)"
        ((SUCCESS_COUNT++))
    else
        echo "❌ Failed"
        echo "   Error: $RESPONSE"
        ((ERROR_COUNT++))
    fi
done

echo ""
echo "📊 Summary:"
echo "✅ Successfully added: $SUCCESS_COUNT vehicles"
echo "❌ Failed to add: $ERROR_COUNT vehicles"

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo ""
    echo "🎉 Mock vehicles have been added to your database!"
    echo "You can now test the delete functionality with these vehicles."
fi
