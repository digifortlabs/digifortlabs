
from datetime import datetime


class EmailService:
    @staticmethod
    def send_login_alert(email: str, ip_address: str, device_info: str):
        """
        Simulates sending a security alert email when a new login occurs.
        In production, this would use SMTP to send a real email.
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # MOCK SENDING (Log to Console)
        print("\n" + "="*60)
        print(f"📧 [MOCK EMAIL SERVICE] Security Alert for: {email}")
        print(f"Time: {timestamp}")
        print("Details: New Login detected.")
        print(f"IP Address: {ip_address}")
        print(f"Device: {device_info}")
        print("Action: If this was not you, please contact support immediately.")
        print("="*60 + "\n")
        
        return True

    @staticmethod
    def send_otp_email(email: str, otp_code: str):
        """
        Sends a password reset OTP using SMTP.
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from datetime import datetime
        from app.core.config import settings

        # SMTP Configuration
        SMTP_SERVER = settings.SMTP_SERVER
        SMTP_PORT = settings.SMTP_PORT
        SMTP_USERNAME = settings.SMTP_USERNAME
        SMTP_PASSWORD = settings.SMTP_PASSWORD
        SENDER_EMAIL = settings.SENDER_EMAIL

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        try:
            msg = MIMEMultipart()
            msg['From'] = SENDER_EMAIL
            msg['To'] = email
            msg['Subject'] = "Security Verification - Digifort Labs"

            body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }}
                    .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }}
                    .header {{ background-color: #1e293b; padding: 30px; text-align: center; }}
                    .header h1 {{ margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 1px; }}
                    .content {{ padding: 40px 30px; }}
                    .otp-box {{ background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #2563eb; border: 1px dashed #cbd5e1; }}
                    .footer {{ background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
                    .expiry {{ text-align: center; color: #ef4444; font-size: 14px; font-weight: 500; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>DIGIFORT LABS</h1>
                    </div>
                    <div class="content">
                        <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                        <p>We received a request to access your account or reset your password. To verify your identity, please use the following One-Time Password (OTP):</p>
                        
                        <div class="otp-box">
                            {otp_code}
                        </div>

                        <p class="expiry">This code is valid for 10 minutes.</p>
                        
                        <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you did not initiate this request, please ignore safe in the knowledge that your account securely remains unchanged.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; {datetime.now().year} Digifort Labs. All rights reserved.</p>
                        <p>This is an automated system message. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SENDER_EMAIL, email, text)
            server.quit()
            
            print(f"✅ [EMAIL SERVICE] OTP Sent to {email}")
            return True

        except Exception as e:
            print(f"❌ [EMAIL SERVICE] Failed to send OTP to {email}: {str(e)}")
            # Fallback to console log for development reliability
            print(f"⚠️ [FALLBACK] OTP Code: {otp_code}")
            return False

