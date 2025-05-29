from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..utils.auth import verify_password, create_access_token, get_password_hash, get_current_active_user
from ..utils.email import email_service
from datetime import datetime, timedelta
import os
import secrets
from dotenv import load_dotenv
import secrets
import hashlib
from datetime import datetime, timedelta

load_dotenv()
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with hashed password
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        password=hashed_password,
        mileage_type=user.mileage_type,
        dark_mode=user.dark_mode
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/forgot-password")
async def forgot_password(
    request: schemas.PasswordResetRequest, 
    db: Session = Depends(get_db)
):
    """
    Request password reset - generates a reset token and sends email
    """
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # For security, don't reveal if email exists or not
        return {"message": "If an account with this email exists, you will receive a password reset email"}
    
    # Clean up any existing unused tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.user_id,
        models.PasswordResetToken.used == False
    ).delete()
    
    # Generate a 6-digit reset token
    reset_token = str(secrets.randbelow(999999)).zfill(6)
    
    # Create token expiry (15 minutes from now)
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Save token to database
    db_token = models.PasswordResetToken(
        user_id=user.user_id,
        token=reset_token,
        expires_at=expires_at,
        used=False
    )
    db.add(db_token)
    db.commit()
    
    # Send email with reset code
    try:
        email_sent = email_service.send_password_reset_email(
            to_email=user.email,
            reset_code=reset_token,
            user_name=user.full_name
        )
        
        if not email_sent:
            # If email fails, clean up the token
            db.delete(db_token)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send reset email. Please try again later."
            )
            
    except Exception as e:
        # If email fails, clean up the token
        db.delete(db_token)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email. Please try again later."
        )
    
    return {"message": "If an account with this email exists, you will receive a password reset email"}

@router.post("/reset-password")
async def reset_password(
    request: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password using the reset token from email
    """
    # Validate token format
    if not request.token.isdigit() or len(request.token) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token format"
        )
    
    # Validate password strength
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Find user by email
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or reset token"
        )
    
    # Find valid token for this user
    token_record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.user_id,
        models.PasswordResetToken.token == request.token,
        models.PasswordResetToken.used == False,
        models.PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update user password
    hashed_password = get_password_hash(request.new_password)
    user.password = hashed_password
    
    # Clean up ALL unused tokens for this user (including the current one)
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.user_id,
        models.PasswordResetToken.used == False
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {"message": "Password reset successful. Please log in with your new password."}

@router.post("/change-password")
async def change_password(
    request: schemas.ChangePassword,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change password for authenticated user - requires current password verification
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # Check that new password is different from current password
    if verify_password(request.new_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    hashed_password = get_password_hash(request.new_password)
    current_user.password = hashed_password
    db.commit()
    
    return {"message": "Password changed successfully"}
