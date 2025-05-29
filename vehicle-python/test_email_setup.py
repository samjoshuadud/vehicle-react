#!/usr/bin/env python3
"""
Test script to verify Gmail SMTP configuration for password reset emails.
Run this script to test your Gmail setup before using the forgot password feature.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

def test_environment_variables():
    """Test if required environment variables are set."""
    print("🔍 Checking environment variables...")
    
    required_vars = ['GMAIL_EMAIL', 'GMAIL_APP_PASSWORD']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file and ensure these variables are set.")
        return False
    
    print("✅ All environment variables are configured")
    return True

def test_email_service_import():
    """Test if the email service can be imported."""
    print("🔍 Testing email service import...")
    
    try:
        from app.utils.email import email_service
        print("✅ Email service imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import email service: {e}")
        return False
    except Exception as e:
        print(f"❌ Error initializing email service: {e}")
        print("This might be due to missing environment variables.")
        return False

def test_smtp_connection():
    """Test SMTP connection to Gmail."""
    print("🔍 Testing SMTP connection...")
    
    try:
        import smtplib
        import ssl
        
        smtp_server = "smtp.gmail.com"
        port = 587
        sender_email = os.getenv("GMAIL_EMAIL")
        password = os.getenv("GMAIL_APP_PASSWORD")
        
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, port) as server:
            server.starttls(context=context)
            server.login(sender_email, password)
        
        print("✅ SMTP connection successful")
        return True
        
    except Exception as e:
        print(f"❌ SMTP connection failed: {e}")
        print("Please check your Gmail credentials and app password.")
        return False

def main():
    """Run all tests."""
    print("🚀 Testing Gmail SMTP configuration for AutoTracker...")
    print("=" * 60)
    
    tests = [
        test_environment_variables,
        test_email_service_import,
        test_smtp_connection
    ]
    
    results = []
    for test in tests:
        result = test()
        results.append(result)
        print()
    
    print("=" * 60)
    if all(results):
        print("🎉 All tests passed! Gmail SMTP is configured correctly.")
        print("You can now use the forgot password feature in the app.")
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
        print("Check the GMAIL_SETUP.md file for detailed setup instructions.")

if __name__ == "__main__":
    main()
