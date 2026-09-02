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

def send_full_welcome():
    print(f"[SMTP] Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
    
    msg = MIMEMultipart()
    msg['From'] = f"Digifort Labs <{SENDER_EMAIL}>"
    msg['To'] = RECIPIENT
    msg['Subject'] = "Welcome to Digifort Labs - Your Account Credentials"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }}
            .wrapper {{ background-color: #f1f5f9; padding: 40px 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }}
            .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; padding: 40px 30px; text-align: center; }}
            .content {{ padding: 40px 30px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }}
            .footer {{ text-align: center; padding: 30px; font-size: 13px; color: #64748b; }}
            .specs {{ margin-top: 20px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1 style="margin:0; font-size: 24px; letter-spacing: 1px;">DIGIFORT LABS</h1>
                </div>
                <div class="content">
                    <h2 style="color: #0f172a; margin-top: 0;">Hello Keval,</h2>
                    <p>Welcome to <strong>Digifort Labs</strong>! Your organization workspace account has been successfully provisioned.</p>
                    
                    <div class="specs">
                        <p style="margin-top: 0; font-weight: 600; color: #0f172a; font-size: 14px;">Account Access Details:</p>
                        <p style="font-size: 14px; color: #475569; margin: 5px 0;"><strong>Username / Email:</strong> {RECIPIENT}</p>
                        <p style="font-size: 14px; color: #475569; margin: 5px 0;"><strong>Portal URL:</strong> https://digifortlabs.com/login</p>
                    </div>

                    <p style="margin-top: 30px;">You can now log in to manage your medical records, IPD/OPD modules, and hospital administration.</p>
                    <a href="https://digifortlabs.com/login" class="button">Log In to Workspace</a>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} Digifort Labs. All rights reserved.<br>
                    Vapi, Valsad, Gujarat, India</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))
    
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
    server.starttls()
    server.login(SMTP_USERNAME, SMTP_PASSWORD)
    server.sendmail(SENDER_EMAIL, [RECIPIENT], msg.as_string())
    server.quit()
    print("[OK] Welcome email sent directly via SMTP server to 29keval@gmail.com!")

if __name__ == "__main__":
    send_full_welcome()
