"""
Centralized configuration for environment variables
"""
import os
from dotenv import load_dotenv

# Load .env file from project root
# This file is at: app/config.py
# Go up 2 levels: config.py -> app/ -> project_root/
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(project_root, '.env')

# Load environment variables
load_dotenv(env_path)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError(
        f"DATABASE_URL environment variable is not set.\n"
        f"Looking for .env at: {env_path}\n"
        f"Current directory: {os.getcwd()}"
    )

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Email configuration
GMAIL_EMAIL = os.getenv("GMAIL_EMAIL")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

# Print loaded config for debugging (remove in production)
print(f"✅ Configuration loaded from: {env_path}")
print(f"📊 Database: {DATABASE_URL[:20]}..." if DATABASE_URL else "❌ No DATABASE_URL")
print(f"🔐 Secret Key: {'Set' if SECRET_KEY else 'Missing'}")
print(f"📧 Gmail: {GMAIL_EMAIL if GMAIL_EMAIL else 'Not configured'}")
