from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import get_current_active_user
from typing import List
from datetime import date, timedelta

router = APIRouter(
    prefix="/reminders",
    tags=["reminders"]
)

@router.post("/", response_model=schemas.Reminder)
async def create_reminder(
    reminder: schemas.ReminderCreate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_reminder = models.Reminder(**reminder.model_dump(), user_id=current_user.user_id)
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.get("/", response_model=List[schemas.Reminder])
async def read_reminders(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reminders = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.user_id
    ).order_by(models.Reminder.due_date).offset(skip).limit(limit).all()
    return reminders

@router.get("/upcoming", response_model=List[schemas.Reminder])
async def read_upcoming_reminders(
    days: int = 7,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    future_date = today + timedelta(days=days)
    reminders = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.user_id,
        models.Reminder.due_date >= today,
        models.Reminder.due_date <= future_date
    ).order_by(models.Reminder.due_date).all()
    return reminders

@router.get("/overdue", response_model=List[schemas.Reminder])
async def read_overdue_reminders(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    reminders = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.user_id,
        models.Reminder.due_date < today
    ).order_by(models.Reminder.due_date).all()
    return reminders

@router.get("/{reminder_id}", response_model=schemas.Reminder)
async def read_reminder(
    reminder_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.reminder_id == reminder_id,
        models.Reminder.user_id == current_user.user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    return reminder

@router.put("/{reminder_id}", response_model=schemas.Reminder)
async def update_reminder(
    reminder_id: int,
    reminder_update: schemas.ReminderUpdate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.reminder_id == reminder_id,
        models.Reminder.user_id == current_user.user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    # Update reminder fields
    for key, value in reminder_update.model_dump(exclude_unset=True).items():
        setattr(reminder, key, value)

    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: int,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.reminder_id == reminder_id,
        models.Reminder.user_id == current_user.user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
        
    db.delete(reminder)
    db.commit()
    return {"ok": True}
