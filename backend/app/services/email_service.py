
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
        Simulates sending a password reset OTP.
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # MOCK SENDING (Log to Console)
        print("\n" + "="*60)
        print(f"🔐 [MOCK EMAIL SERVICE] Password Reset OTP for: {email}")
        print(f"Time: {timestamp}")
        print(f"OTP Code: {otp_code}")
        print("Action: Enter this code to reset your password.")
        print("="*60 + "\n")
        
        return True
