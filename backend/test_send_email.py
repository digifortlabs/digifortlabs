import sys
import traceback
from app.services.email_service import EmailService
from app.core.config import settings

def send_test():
    print("==========================================")
    print("EMAIL SERVICE DIAGNOSTIC TEST")
    print("==========================================")
    print(f"SMTP Server:   {settings.SMTP_SERVER}")
    print(f"SMTP Port:     {settings.SMTP_PORT}")
    print(f"SMTP User:     {settings.SMTP_USERNAME}")
    print(f"Sender Email:  {settings.SENDER_EMAIL}")
    print(f"Recipient:     29keval@gmail.com")
    print("------------------------------------------")

    try:
        res = EmailService.send_welcome_email(
            email="29keval@gmail.com",
            name="Keval Test Admin",
            password="DemoPassword#2026",
            login_url="https://digifortlabs.com/login"
        )
        print(f"[RESULT] Welcome Email Dispatch Success Status: {res}")
    except Exception as e:
        print(f"[ERROR] Exception occurred: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    send_test()
