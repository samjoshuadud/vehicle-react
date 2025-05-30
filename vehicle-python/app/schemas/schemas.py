from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional, List
from decimal import Decimal

# User Schemas
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    mileage_type: str = "kilometers"
    dark_mode: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    mileage_type: Optional[str] = None
    dark_mode: Optional[bool] = None

class User(UserBase):
    user_id: int
    
    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleBase(BaseModel):
    make: str
    model: str
    year: int
    color: Optional[str] = None
    license_plate: Optional[str] = None
    vin: Optional[str] = None
    current_mileage: int = 0
    fuel_type: Optional[str] = None
    purchase_date: Optional[date] = None
    vehicle_image: Optional[str] = None  # Base64 encoded image data

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(VehicleBase):
    pass

class Vehicle(VehicleBase):
    vehicle_id: int
    user_id: int

    class Config:
        from_attributes = True

# Maintenance Schemas
class MaintenanceBase(BaseModel):
    date: date
    maintenance_type: Optional[str] = None
    description: Optional[str] = None
    mileage: Optional[int] = None
    cost: Optional[Decimal] = Field(None, decimal_places=2)
    location: Optional[str] = None
    notes: Optional[str] = None

class MaintenanceCreate(MaintenanceBase):
    vehicle_id: int

class MaintenanceUpdate(MaintenanceBase):
    pass

class Maintenance(MaintenanceBase):
    maintenance_id: int
    vehicle_id: int

    class Config:
        from_attributes = True

# Fuel Schemas
class FuelBase(BaseModel):
    date: date
    liters: Optional[Decimal] = Field(None, decimal_places=2)
    kwh: Optional[Decimal] = Field(None, decimal_places=2)  # For electric vehicles
    cost: Optional[Decimal] = Field(None, decimal_places=2)
    odometer_reading: Optional[int] = None
    location: Optional[str] = None
    full_tank: bool = False
    notes: Optional[str] = None

class FuelCreate(FuelBase):
    vehicle_id: int

class FuelUpdate(FuelBase):
    pass

class Fuel(FuelBase):
    fuel_id: int
    vehicle_id: int

    class Config:
        from_attributes = True

# Reminder Schemas
class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: date
    repeat_interval: Optional[str] = None
    mileage_interval: Optional[int] = None  # New field for mileage-based reminders

class ReminderCreate(ReminderBase):
    vehicle_id: int

class ReminderUpdate(ReminderBase):
    pass

class Reminder(ReminderBase):
    reminder_id: int
    user_id: int
    vehicle_id: int

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

# Password Reset Schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    token: str
    new_password: str

# Change Password Schema
class ChangePassword(BaseModel):
    current_password: str
    new_password: str
