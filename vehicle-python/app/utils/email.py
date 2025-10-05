import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from jinja2 import Template
from ..config import GMAIL_EMAIL, GMAIL_APP_PASSWORD

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = GMAIL_EMAIL
        self.sender_password = GMAIL_APP_PASSWORD  # Gmail App Password
        
        if not self.sender_email or not self.sender_password:
            raise ValueError("Gmail credentials not found in environment variables")

    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str, 
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email using Gmail SMTP
        
        Args:
            to_email: Recipient's email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.sender_email
            message["To"] = to_email

            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)

            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            # Create secure connection and send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False

    def send_password_reset_email(self, to_email: str, reset_code: str, user_name: str = None) -> bool:
        """
        Send a password reset email with the reset code
        
        Args:
            to_email: User's email address
            reset_code: 6-digit reset code
            user_name: User's name (optional)
            
        Returns:
            bool: True if email sent successfully
        """
        subject = "AutoTracker - Password Reset Code"
        
        # HTML email template
        html_template = Template("""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f9fafb;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .email-card {
                    background: white;
                    border-radius: 8px;
                    padding: 40px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                .logo {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .app-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1f2937;
                    margin: 0;
                }
                .reset-code {
                    background: #3b82f6;
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    border-radius: 8px;
                    letter-spacing: 4px;
                    margin: 30px 0;
                    font-family: 'Courier New', monospace;
                }
                .warning {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 6px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #92400e;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #6b7280;
                    font-size: 14px;
                }
                h1 {
                    color: #1f2937;
                    margin-bottom: 20px;
                }
                p {
                    color: #374151;
                    margin-bottom: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-card">
                    <div class="logo">
                        <h1 class="app-name">🚗 AutoTracker</h1>
                    </div>
                    
                    <h1>Password Reset Request</h1>
                    
                    {% if user_name %}
                    <p>Hello {{ user_name }},</p>
                    {% else %}
                    <p>Hello,</p>
                    {% endif %}
                    
                    <p>We received a request to reset your password for your AutoTracker account. Use the verification code below to reset your password:</p>
                    
                    <div class="reset-code">{{ reset_code }}</div>
                    
                    <p>This code will expire in <strong>15 minutes</strong> for security reasons.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.
                    </div>
                    
                    <p>If you're having trouble, please contact our support team.</p>
                    
                    <div class="footer">
                        <p>
                            Best regards,<br>
                            The AutoTracker Team
                        </p>
                        <p>
                            This is an automated email. Please do not reply to this message.
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """)
        
        # Plain text version
        text_content = f"""
        AutoTracker - Password Reset Code
        
        Hello{f' {user_name}' if user_name else ''},
        
        We received a request to reset your password for your AutoTracker account.
        
        Your verification code is: {reset_code}
        
        This code will expire in 15 minutes for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The AutoTracker Team
        """
        
        html_content = html_template.render(
            reset_code=reset_code,
            user_name=user_name
        )
        
        return self.send_email(to_email, subject, html_content, text_content)

# Global email service instance
email_service = EmailService()
