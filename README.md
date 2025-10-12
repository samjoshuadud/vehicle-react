# 🚗 Vehicle Maintenance & Fuel Tracking App

A comprehensive mobile application built with **React Native (Expo)** and **FastAPI** backend for tracking vehicle maintenance, fuel consumption, and community-sourced fuel prices in the Philippines.

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020.svg)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB.svg)](https://www.python.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technical Stack](#-technical-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [License](#-license)

---

## 🎯 Overview

This app helps vehicle owners in the Philippines:
- 📊 Track maintenance history and fuel consumption
- 💰 Find the cheapest gas stations nearby using community data
- 🔔 Set reminders for upcoming maintenance
- 📈 Monitor vehicle expenses over time
- 🗺️ Discover fuel prices on an interactive map

**Perfect for:**
- Personal vehicle owners
- Fleet managers
- Budget-conscious drivers
- Electric vehicle owners
- Multi-vehicle households

---

## ✨ Features

### 1. **Vehicle Management** 🚙

Manage multiple vehicles with comprehensive details:

- **Vehicle Information:**
  - Year, Make, Model
  - License Plate
  - VIN (Vehicle Identification Number)
  - Fuel Type (Gasoline Unleaded/Premium, Diesel, Electric, Hybrid, Plug-in Hybrid)
  - Current Mileage/Odometer
  - Vehicle Photo (upload from gallery or camera)
  - Purchase Date

- **Operations:**
  - Add unlimited vehicles
  - Edit vehicle details
  - Delete vehicles with confirmation
  - View detailed vehicle statistics
  - Long-press for quick actions (Edit/Delete)

---

### 2. **Fuel Log Tracking** ⛽

Record and analyze fuel purchases with detailed tracking:

- **Log Details:**
  - 📍 Location (with interactive map picker)
  - ⛽ Fuel type (auto-detected from vehicle)
  - 📊 Amount (Liters for fuel, kWh for electric)
  - 💵 Total cost
  - 📅 Date
  - 📝 Notes

- **Multi-Unit Support:**
  - **Volume:** Liters ↔ US Gallons ↔ Imperial Gallons
  - **Energy:** kWh for electric vehicles
  - Automatic conversion between units
  - User-selectable preferred units

- **Advanced Location Picker:**
  - 🔍 Search locations (via Nominatim/OpenStreetMap)
  - 🗺️ Interactive Leaflet map
  - 📍 Tap anywhere to select location
  - 🎯 Current location detection
  - ⛽ Gas station markers (via Overpass API)
  - 🔄 Reverse geocoding (coordinates → address)
  - 🇵🇭 Philippines-focused search

---

### 3. **Maintenance Log Tracking** 🔧

Comprehensive maintenance record keeping:

- **Maintenance Types:**
  - Oil Change, Tire Rotation, Brake Service
  - Battery Replacement, Air Filter Change
  - Spark Plugs, Transmission Service
  - Coolant Flush, Wheel Alignment
  - Other (custom)
  
- **Log Information:**
  - 🔧 Maintenance type
  - 💰 Cost
  - 📏 Odometer reading (at time of service)
  - 📍 Location/Service provider
  - 📅 Date
  - 📝 Notes/Description

---

### 4. **Community Fuel Price Map** 🗺️

**Real-time fuel prices crowdsourced from user fuel logs** - Find the cheapest fuel nearby!

#### **Interactive Map View:**

- 🗺️ **Leaflet-powered map** with OpenStreetMap tiles
- 📍 **Color-coded markers:**
  - 🟢 Green = Cheapest (bottom 33%)
  - 🟠 Orange = Average (middle 33%)
  - 🔴 Red = Expensive (top 33%)
- 📊 **Click any station** to see:
  - Station name and all available fuel types
  - Individual prices per fuel type
  - Distance from your location
  - Number of reports & last updated

#### **List View:**

- 📋 Stations sorted by distance
- 💳 **Expandable cards:**
  - Single fuel type → Shows badge (e.g., ⛽ Unleaded)
  - Multiple fuel types → Tap to expand and see all prices
- 🔄 Pull to refresh

#### **Smart Filtering:**

- **Radius:** 5km / 10km / 25km / 50km
- **Fuel Type:** All / Unleaded / Premium / Diesel / Electric / Hybrid
- **Brand:** All / Shell / Petron / Caltex / Phoenix / Seaoil / Unioil / Cleanfuel / Total / Others
- **Country:** Philippines (default)

#### **Price Calculation:**

- ✅ Average, Min, Max prices per fuel type
- 📊 Separate pricing for each fuel type at same station
- 🔢 Report count transparency
- 📅 Based on last 7 days of data

#### **Station Clustering:**

- 🎯 Groups nearby reports (within 100m radius)
- 📍 Calculates weighted average location
- 🏷️ Normalizes station names
- 🚫 Prevents duplicate stations

---

### 5. **Manual Reminders System** 🔔

Create custom maintenance reminders:

- **Reminder Configuration:**
  - 📝 Title & Description
  - 📅 Due date
  - 🔁 Repeat intervals (None, Daily, Weekly, Monthly, Yearly)
  - 📏 Mileage-based intervals
  - 🚗 Vehicle association

- **Filter Views:**
  - All Reminders
  - Upcoming
  - Overdue

---

### 6. **Dashboard** 📊

Home screen with vehicle overview:

- **Vehicle Summary Cards:**
  - 📸 Vehicle photo
  - 🚗 Make/Model/Year
  - 📏 Current mileage
  - ⛽ Fuel type badge
  - 📅 Purchase date
  - 🆕 **Latest vehicles shown first**

---

### 7. **Spending Insights** 💰

Dedicated analytics tab for comprehensive spending tracking:

#### **Current Month Overview:**
- 💰 **Total Monthly Spending** (Fuel + Maintenance combined)
- 📊 **Category Breakdown:**
  - ⛽ Fuel: Total cost & fill-up count
  - 🔧 Maintenance: Total cost & service count
- 📈 **Trend Analysis:**
  - Percentage change vs previous month
  - Visual indicators (up/down arrows)
  - Color-coded badges (red for increase, green for decrease)

#### **Monthly History:**
- 📅 Last 3 months spending overview
- � Transaction counts per month
- � Easy comparison between months

#### **Quick Stats:**
- � Total vehicles managed
- ⛽ Total fuel logs recorded
- 🔧 Total maintenance services tracked

#### **Features:**
- � Pull-to-refresh data
- 📱 Beautiful card-based UI
- � Color-coded visual indicators
- 💡 Empty state guidance

---

### 8. **Vehicle Detail Page** 🚗

Comprehensive vehicle information:

- **Statistics Cards:**
  - Current Mileage
  - Purchase Date
  - Fuel Type

- **Tabbed Interface:**
  - 🔥 Fuel Logs
  - 🔧 Maintenance Logs
  - 🔔 Reminders (filtered by vehicle)

---

## 🛠️ Technical Stack

### **Frontend** (Mobile App)

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 51** | Development platform & tools |
| **TypeScript** | Type-safe JavaScript |
| **Expo Router** | File-based navigation |
| **React Context API** | State management |
| **Leaflet.js** | Interactive maps |
| **WebView** | Map rendering |
| **Expo Location** | GPS & location services |
| **Expo Image Picker** | Photo selection |
| **Ionicons** | Icon library |

### **Backend** (API Server)

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **SQLAlchemy** | ORM (Object-Relational Mapping) |
| **MySQL** | Database |
| **Pydantic** | Data validation |
| **JWT** | Authentication tokens |
| **Bcrypt** | Password hashing |
| **Uvicorn** | ASGI server |

### **External APIs**

| API | Purpose | Rate Limit |
|-----|---------|-----------|
| **Nominatim** | Geocoding (address ↔ coordinates) | 1 req/sec |
| **Overpass API** | OpenStreetMap data (gas stations) | Fair use |
| **OpenStreetMap** | Map tiles (CartoDB Voyager) | Free |

---

## 🏗️ Architecture

### **Frontend Structure**

```
vehicle-react/
├── app/                          # App screens (Expo Router)
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── index.tsx             # Dashboard/Home
│   │   ├── fuel-prices.tsx       # Community fuel price map
│   │   └── reminders.tsx         # Reminders list
│   ├── vehicle/[id].tsx          # Vehicle detail page
│   ├── add-vehicle.tsx           # Add new vehicle
│   ├── edit-vehicle/[id].tsx     # Edit vehicle
│   ├── add-fuel/[vehicleId].tsx  # Add fuel log
│   ├── edit-fuel/[id].tsx        # Edit fuel log
│   ├── add-maintenance/[vehicleId].tsx  # Add maintenance
│   ├── edit-maintenance/[id].tsx        # Edit maintenance
│   ├── add-reminder/[vehicleId].tsx     # Add reminder
│   └── edit-reminder/[id].tsx           # Edit reminder
├── components/                   # Reusable UI components
│   ├── ui/
│   │   ├── LocationPicker.tsx    # Interactive location picker
│   │   └── SafeArea.tsx          # Safe area wrapper
│   ├── VehicleCard.tsx
│   ├── FuelLogItem.tsx
│   ├── MaintenanceLogItem.tsx
│   └── ReminderItem.tsx
├── context/                      # React Context providers
│   ├── AuthContext.tsx
│   ├── VehiclesContext.tsx
│   ├── RemindersContext.tsx
│   └── ThemeContext.tsx
├── services/
│   ├── api.ts                    # API service client
│   └── locationService.ts
└── utils/
    └── units.ts                  # Unit conversions
```

### **Backend Structure**

```
vehicle-python/
├── app/
│   ├── main.py                   # FastAPI app entry point
│   ├── database/
│   │   └── database.py           # SQLAlchemy setup
│   ├── models/
│   │   └── models.py             # Database models
│   ├── schemas/
│   │   └── schemas.py            # Pydantic schemas
│   ├── routes/                   # API endpoints
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── vehicles.py
│   │   ├── fuel.py
│   │   ├── maintenance.py
│   │   ├── reminders.py
│   │   ├── prices.py
│   │   └── locations.py
│   └── services/
│       └── location_service.py   # Price calculation, clustering
└── migrations/                   # Alembic migrations
```

---

## 🚀 Installation

### **Prerequisites**

- **Node.js** 18+ and npm
- **Python** 3.13+
- **MySQL** 8+
- **Expo CLI**
- **Expo Go** app on your mobile device

### **Backend Setup**

```bash
# Navigate to backend directory
cd vehicle-python

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
# Create MySQL database named 'vehicle'
mysql -u root -p
CREATE DATABASE vehicle;
EXIT;

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Setup**

```bash
# Navigate to frontend directory
cd vehicle-react

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### **Running the App**

1. Ensure backend is running on `http://localhost:8000`
2. Start Expo development server
3. Scan QR code with Expo Go app
4. App will connect to backend (update `API_BASE_URL` in `services/api.ts` if needed)

---

## ⚙️ Configuration

### **Backend Configuration**

Create `.env` file in `vehicle-python/`:

```env
# Database
DATABASE_URL=mysql+pymysql://root:@localhost:3306/vehicle

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

### **Frontend Configuration**

Update `vehicle-react/services/api.ts`:

```typescript
// Change this to your backend URL
export const API_BASE_URL = 'http://192.168.100.114:8000';
```

**Finding your backend IP:**
```bash
# On macOS/Linux
ifconfig | grep inet

# On Windows
ipconfig
```

---

## 📖 Usage

### **Getting Started**

1. **Sign Up / Login**
   - Create account with email and password
   - Login to access your data

2. **Add Your First Vehicle**
   - Tap ➕ button on dashboard
   - Fill in vehicle details
   - Save vehicle

3. **Log Fuel Purchases**
   - Open vehicle → "Fuel" tab → ➕
   - Search or select location on map
   - Enter fuel amount and cost
   - **Your data automatically contributes to community fuel prices!** 🎉

4. **Track Maintenance**
   - Open vehicle → "Maintenance" tab → ➕
   - Select maintenance type
   - Enter cost and odometer reading
   - Save record

5. **Set Reminders**
   - Navigate to Reminders tab → ➕
   - Set title, due date, and repeat interval
   - Save reminder

6. **Find Cheap Fuel**
   - Go to "Fuel Prices" tab
   - View map or list view
   - Filter by fuel type and radius
   - See color-coded prices

---

## 📡 API Documentation

### **Authentication**

```
POST /auth/signup          # Create new account
POST /auth/login           # Login
GET  /auth/me              # Get current user
```

### **Vehicles**

```
GET    /vehicles           # List all vehicles
POST   /vehicles           # Create vehicle
GET    /vehicles/{id}      # Get vehicle details
PUT    /vehicles/{id}      # Update vehicle
DELETE /vehicles/{id}      # Delete vehicle
```

### **Fuel Logs**

```
GET    /fuel/{vehicle_id}           # Get vehicle fuel logs
POST   /fuel                        # Create fuel log
PUT    /fuel/{id}                   # Update fuel log
DELETE /fuel/{id}                   # Delete fuel log
```

### **Maintenance Logs**

```
GET    /maintenance/{vehicle_id}    # Get vehicle maintenance logs
POST   /maintenance                 # Create maintenance log
PUT    /maintenance/{id}            # Update maintenance log
DELETE /maintenance/{id}            # Delete maintenance log
```

### **Reminders**

```
GET    /reminders                   # List all reminders
POST   /reminders                   # Create reminder
GET    /reminders/{id}              # Get reminder details
PUT    /reminders/{id}              # Update reminder
DELETE /reminders/{id}              # Delete reminder
```

### **Fuel Prices**

```
GET    /prices/fuel                 # Get fuel prices near location
       ?latitude={lat}
       &longitude={lng}
       &radius_km={radius}
       &fuel_type={type}
       &country={country}
```

**Interactive API Docs:** Visit `http://localhost:8000/docs` when backend is running

---

## 🌟 Key Features

### **Community Fuel Prices - How It Works**

1. User adds fuel log with location, amount, cost
2. Backend normalizes location name
3. Checks if station exists within 100m radius
4. Updates existing cluster or creates new one
5. Calculates average price per fuel type
6. Returns data to all users in range

**Privacy:** Only aggregated prices are shared, never individual user data

### **Location Clustering Algorithm**

- Prevents duplicate stations
- Handles GPS variations
- Groups same station with different name formats
- Uses Haversine formula for distance calculation
- Fuzzy name matching (80% similarity threshold)

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - Bcrypt encryption
- ✅ **User Isolation** - Users can only access their own data
- ✅ **Input Validation** - Pydantic schema validation
- ✅ **SQL Injection Protection** - SQLAlchemy ORM
- ✅ **CORS Configuration** - Restricted origins

---

## 🌍 Philippines-Specific Features

- 🇵🇭 **Default Country** - Philippines in location searches
- ₱ **Currency** - Philippine Peso (₱)
- ⛽ **Gas Stations** - Common PH brands (Shell, Petron, Caltex, Phoenix, Seaoil, etc.)
- 🗺️ **Map Focus** - Philippine regions prioritized

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Sam Joshua Dud**
- GitHub: [@samjoshuadud](https://github.com/samjoshuadud)

---

## 🙏 Acknowledgments

- **OpenStreetMap** - Free map data
- **Nominatim** - Geocoding service
- **Expo** - Amazing development platform
- **FastAPI** - High-performance web framework
- **React Native Community** - Excellent documentation

---

**Built with ❤️ in the Philippines** 🇵🇭
