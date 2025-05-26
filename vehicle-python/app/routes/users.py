from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import get_current_active_user, get_password_hash
from typing import List

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user = Depends(get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
async def update_user(
    user_update: schemas.UserUpdate,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Update user fields
    if user_update.full_name:
        current_user.full_name = user_update.full_name
    if user_update.email:
        # Check if email is already taken
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.user_id != current_user.user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_update.email
    if user_update.password:
        current_user.password = get_password_hash(user_update.password)
    if user_update.mileage_type:
        current_user.mileage_type = user_update.mileage_type
    current_user.dark_mode = user_update.dark_mode

    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"ok": True}
