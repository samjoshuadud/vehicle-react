# Vehicle Maintenance App

A full-stack vehicle maintenance tracking application built with FastAPI (Backend) and React Native (Frontend).

## Backend Setup (Python)

### Prerequisites
- Python 3.8 or higher
- MySQL Server
- pip (Python package manager)

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd vehicle/vehicle-python
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
# For Windows
.\venv\Scripts\activate
# For Linux/Mac
source venv/bin/activate
```

3. Install required packages:
```bash
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv pydantic cryptography python-jose[cryptography] passlib[bcrypt] python-multipart
```

4. Set up environment variables:
i use phpmyadmin here so it will be different (i think?)
Create a `.env` file in the vehicle-python directory with:
```env
DATABASE_URL=mysql+pymysql://root:@localhost:3306/vehicle
SECRET_KEY=your-secret-key-for-jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation will be at `http://localhost:8000/docs`

## Frontend Setup (React Native)

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)

### Installation Steps

1. Navigate to the frontend directory:
```bash
cd vehicle/vehicle-react
```

2. Install dependencies:
```bash
yarn install
# or using npm
npm install
```

3. Install required Expo packages:
```bash
npx expo install @expo/vector-icons expo-router react-native-safe-area-context expo-linking expo-constants expo-status-bar react-native-gesture-handler expo-image-picker
```

4. Create environment configuration:
Create a `.env` file in the vehicle-react directory with:
```env
API_URL=http://localhost:8000
```

5. Run the development server:
```bash
yarn start
# or using npm
npm start
```

### Running on Different Platforms

- **Web**:
  ```bash
  yarn web
  # or
  npm run web
  ```

- **Android**:
  ```bash
  yarn android
  # or
  npm run android
  ```

- **iOS** (Mac only):
  ```bash
  yarn ios
  # or
  npm run ios
  ```

## Database Setup

1. Create the database:
```sql
CREATE DATABASE vehicle;
```

2. Run the SQL schema:
```bash
mysql -u root vehicle < db/vehicle.sql
```

## Features

- User authentication and authorization
- Vehicle management
- Maintenance tracking
- Fuel log tracking
- Service reminders
- Dark mode support
- Localization (kilometers/miles)

## API Documentation

After starting the backend server, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=mysql+pymysql://root:@localhost:3306/vehicle
SECRET_KEY=your-secret-key-for-jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env)
```env
API_URL=http://localhost:8000
```

## Project Structure

```
vehicle/
├── vehicle-python/       # Backend
│   ├── app/
│   │   ├── database/    # Database connection
│   │   ├── models/      # SQLAlchemy models
│   │   ├── routes/      # API routes
│   │   ├── schemas/     # Pydantic schemas
│   │   └── utils/       # Utilities
│   └── main.py
├── vehicle-react/        # Frontend
│   ├── app/             # Screens
│   ├── components/      # Reusable components
│   ├── context/         # React Context
│   └── services/        # API services
└── db/                  # Database scripts
```

## Development Notes

- Backend uses FastAPI with SQLAlchemy ORM
- Frontend uses React Native with Expo
- Database is MySQL
- JWT authentication
- File uploads handled through backend storage
- Supports both miles and kilometers for measurements
