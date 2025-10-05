from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.database import engine
from .models import models

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vehicle Maintenance API",
    description="API for managing vehicle maintenance, fuel logs, and reminders",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from .routes import auth, users, vehicles, maintenance, fuel, reminders, prices

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(vehicles.router)
app.include_router(maintenance.router)
app.include_router(fuel.router)
app.include_router(reminders.router)
app.include_router(prices.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Vehicle Maintenance API"}
