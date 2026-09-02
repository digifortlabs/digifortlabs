import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

SMTP_SERVER = "smtp.digifortlabs.com"
SMTP_PORT = 587
SMTP_USERNAME = "admin@digifortlabs.com"
SMTP_PASSWORD = "Digif0rt2026"
SENDER_EMAIL = "admin@digifortlabs.com"
RECIPIENT = "29keval@gmail.com"

print("==========================================")
print("DIRECT SMTP CONNECTION DIAGNOSTIC")
print("==========================================")
print(f"Connecting to {SMTP_SERVER}:{SMTP_PORT} as {SMTP_USERNAME}...")

try:
    msg = MIMEMultipart()
    msg['From'] = f"Digifort Labs <{SENDER_EMAIL}>"
    msg['To'] = RECIPIENT
    msg['Subject'] = "Welcome to Digifort Labs - Test Email"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #2563eb;">Welcome to Digifort Labs!</h2>
        <p>Hello Keval,</p>
        <p>This is a direct test email confirming your welcome notification setup for <strong>29keval@gmail.com</strong>.</p>
        <br>
        <p>Best Regards,<br><strong>Digifort Labs Team</strong></p>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))
    
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
    print("-> Connected. Initiating STARTTLS...")
    server.starttls()
    print("-> STARTTLS successful. Logging in...")
    server.login(SMTP_USERNAME, SMTP_PASSWORD)
    print("-> Login successful. Sending mail...")
    server.sendmail(SENDER_EMAIL, [RECIPIENT], msg.as_string())
    server.quit()
    print("[SUCCESS] Mail sent successfully to 29keval@gmail.com!")
except Exception as e:
    print(f"[ERROR] Direct SMTP Failed: {e}")
    import traceback
    traceback.print_exc()
