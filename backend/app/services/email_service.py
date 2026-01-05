
import os
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
        print(f"Details: New Login detected.")
        print(f"IP Address: {ip_address}")
        print(f"Device: {device_info}")
        print(f"Action: If this was not you, please contact support immediately.")
        print("="*60 + "\n")
        
        return True
