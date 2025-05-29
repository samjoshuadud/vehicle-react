# Gmail SMTP Setup for Password Reset

This guide explains how to configure Gmail SMTP for sending password reset emails in the AutoTracker application.

## Prerequisites

1. A Gmail account
2. Gmail account with 2-Factor Authentication enabled
3. Gmail App Password generated

## Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** tab
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup process to enable 2FA

## Step 2: Generate App Password

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** tab
3. Under "Signing in to Google", click **App passwords**
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter "AutoTracker" as the custom name
7. Click **Generate**
8. Copy the 16-character app password (remove spaces)

## Step 3: Configure Environment Variables

Update the `.env` file in `/vehicle-python/` directory:

```bash
# Gmail SMTP Configuration
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the app password from Step 2

## Step 4: Install Dependencies

Make sure the following packages are installed in your Python environment:

```bash
pip install aiosmtplib email-validator jinja2
```

Or install from requirements.txt:

```bash
pip install -r requirements.txt
```

## Step 5: Test the Configuration

1. Start the FastAPI backend server
2. Use the forgot password feature in the mobile app
3. Check your email for the password reset code

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit the `.env` file** to version control
2. **Use App Passwords**, not your main Gmail password
3. **Regularly rotate App Passwords** (every 6-12 months)
4. **Monitor email usage** for any suspicious activity
5. **Consider using a dedicated email** for sending app notifications

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Verify 2FA is enabled
   - Check that you're using the App Password, not your regular password
   - Ensure the email address is correct

2. **"Connection refused"**
   - Check your internet connection
   - Verify firewall settings allow SMTP connections
   - Ensure port 587 is not blocked

3. **"Email not received"**
   - Check spam/junk folder
   - Verify the recipient email address
   - Check Gmail's sending limits

### Testing SMTP Connection:

You can test the SMTP connection using Python:

```python
import smtplib
import ssl

smtp_server = "smtp.gmail.com"
port = 587
sender_email = "your-email@gmail.com"
password = "your-app-password"

context = ssl.create_default_context()
try:
    server = smtplib.SMTP(smtp_server, port)
    server.starttls(context=context)
    server.login(sender_email, password)
    print("✅ SMTP connection successful!")
    server.quit()
except Exception as e:
    print(f"❌ SMTP connection failed: {e}")
```

## Email Template Customization

The password reset email template can be customized in:
`/vehicle-python/app/utils/email.py`

The template includes:
- Company branding
- Reset code display
- Security warnings
- Professional styling
- Mobile-responsive design

## Rate Limiting

Gmail has sending limits:
- **500 recipients per day** for regular Gmail accounts
- **2000 recipients per day** for Google Workspace accounts

For production applications with high volume, consider:
- Using dedicated email services (SendGrid, Mailgun, AWS SES)
- Implementing email queuing
- Adding rate limiting to prevent abuse

## Production Considerations

For production deployment:

1. **Use environment-specific configurations**
2. **Implement proper logging** for email delivery tracking
3. **Add email delivery confirmation** mechanisms
4. **Consider using dedicated email services** for better deliverability
5. **Implement email templates** stored in database for easy updates
6. **Add email delivery status tracking**
7. **Implement retry mechanisms** for failed deliveries

## Alternative Email Providers

While this guide focuses on Gmail, the SMTP configuration can be adapted for other providers:

- **Outlook/Hotmail**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587
- **Custom SMTP**: Use your hosting provider's SMTP settings

Update the `smtp_server` and `smtp_port` in `/vehicle-python/app/utils/email.py` accordingly.
