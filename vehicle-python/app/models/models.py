from sqlalchemy import Column, Integer, String, Boolean, Date, Enum, ForeignKey, Text, Numeric, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import LONGTEXT
from datetime import datetime
from ..database.database import Base

class User(Base):
    __tablename__ = "Users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    mileage_type = Column(Enum('kilometers', 'miles', name='mileage_type'), default='kilometers')
    dark_mode = Column(Boolean, default=False)

    # Relationships
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete")

class Vehicle(Base):
    __tablename__ = "Vehicles_Info"

    vehicle_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.user_id', ondelete='CASCADE'), nullable=False)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String(30))
    license_plate = Column(String(20), unique=True)
    vin = Column(String(50), unique=True)
    current_mileage = Column(Integer, default=0)
    fuel_type = Column(String(30))
    purchase_date = Column(Date)
    vehicle_image = Column(LONGTEXT)  # Base64 encoded image data

    # Relationships
    owner = relationship("User", back_populates="vehicles")
    maintenance_logs = relationship("Maintenance", back_populates="vehicle", cascade="all, delete")
    fuel_logs = relationship("Fuel", back_populates="vehicle", cascade="all, delete")
    reminders = relationship("Reminder", back_populates="vehicle", cascade="all, delete")

class Maintenance(Base):
    __tablename__ = "Maintenance_Info"

    maintenance_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey('Vehicles_Info.vehicle_id', ondelete='CASCADE'), nullable=False)
    date = Column(Date, nullable=False)
    maintenance_type = Column(String(100))
    description = Column(Text)
    mileage = Column(Integer)
    cost = Column(DECIMAL(10,2))
    location = Column(String(100))
    notes = Column(Text)

    # Relationship
    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

class Fuel(Base):
    __tablename__ = "Fuel_Info"

    fuel_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey('Vehicles_Info.vehicle_id', ondelete='CASCADE'), nullable=False)
    date = Column(Date, nullable=False)
    liters = Column(DECIMAL(10,2))
    kwh = Column(DECIMAL(10,2))  # For electric vehicles
    cost = Column(DECIMAL(10,2))
    location = Column(String(100))
    full_tank = Column(Boolean, default=False)
    notes = Column(Text)

    # Relationship
    vehicle = relationship("Vehicle", back_populates="fuel_logs")

class Reminder(Base):
    __tablename__ = "Reminders_Info"

    reminder_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.user_id', ondelete='CASCADE'), nullable=False)
    vehicle_id = Column(Integer, ForeignKey('Vehicles_Info.vehicle_id', ondelete='CASCADE'), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    due_date = Column(Date, nullable=False)
    repeat_interval = Column(String(50))
    mileage_interval = Column(Integer)  # New field for mileage-based reminders

    # Relationships
    user = relationship("User", back_populates="reminders")
    vehicle = relationship("Vehicle", back_populates="reminders")

class PasswordResetToken(Base):
    __tablename__ = "Password_Reset_Tokens"

    token_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.user_id', ondelete='CASCADE'), nullable=False)
    token = Column(String(6), nullable=False)  # 6-digit code
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User")
