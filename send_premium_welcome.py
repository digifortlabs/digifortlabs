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

def send_premium_welcome():
    print(f"[SMTP] Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
    
    msg = MIMEMultipart()
    msg['From'] = f"Digifort Labs <{SENDER_EMAIL}>"
    msg['To'] = RECIPIENT
    msg['Subject'] = "Welcome to Digifort Labs - Executive Workspace Access"
    
    body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Digifort Labs</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }}
        .wrapper {{
            background-color: #f8fafc;
            padding: 40px 15px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background: #0f172a;
            color: #ffffff;
            padding: 36px 32px;
            text-align: center;
            border-bottom: 3px solid #2563eb;
        }}
        .logo-title {{
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #ffffff;
        }}
        .subtitle {{
            margin: 6px 0 0 0;
            font-size: 12px;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .content {{
            padding: 40px 32px;
        }}
        .greeting {{
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 16px;
        }}
        .paragraph {{
            font-size: 15px;
            color: #475569;
            margin-bottom: 20px;
        }}
        .credential-card {{
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-left: 4px solid #0284c7;
            border-radius: 12px;
            padding: 24px;
            margin: 28px 0;
        }}
        .card-label {{
            font-size: 11px;
            font-weight: 800;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 14px;
        }}
        .detail-row {{
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #cbd5e1;
        }}
        .detail-row:last-child {{
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }}
        .detail-key {{
            font-size: 12px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            display: block;
        }}
        .detail-val {{
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 2px;
        }}
        .badge-pass {{
            background: #ffffff;
            color: #0284c7;
            padding: 6px 14px;
            border-radius: 6px;
            border: 1px solid #7dd3fc;
            font-weight: 800;
            letter-spacing: 2px;
            font-family: monospace;
            display: inline-block;
        }}
        .cta-container {{
            text-align: center;
            margin: 32px 0 24px 0;
        }}
        .btn-primary {{
            display: inline-block;
            background: #2563eb;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }}
        .security-notice {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px 20px;
            font-size: 13px;
            color: #64748b;
            margin-top: 24px;
        }}
        .footer {{
            background: #f8fafc;
            padding: 24px 32px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
        }}
        .footer-link {{
            color: #2563eb;
            text-decoration: none;
        }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1 class="logo-title">DIGIFORT LABS</h1>
                <p class="subtitle">Next-Gen Enterprise Hospital Management Suite</p>
            </div>
            <div class="content">
                <h2 class="greeting">Welcome to the Platform, Keval</h2>
                <p class="paragraph">
                    We are pleased to inform you that your organization's dedicated workspace has been fully provisioned on the Digifort Labs HMS platform.
                </p>
                <p class="paragraph">
                    Below are your secure initial administrative access credentials. For compliance and account security, please complete your first log in and update your password immediately.
                </p>
                
                <div class="credential-card">
                    <div class="card-label">Workspace Credentials</div>
                    <div class="detail-row">
                        <span class="detail-key">Portal Endpoint</span>
                        <div class="detail-val">https://digifortlabs.com/login</div>
                    </div>
                    <div class="detail-row">
                        <span class="detail-key">Account Identity</span>
                        <div class="detail-val">{RECIPIENT}</div>
                    </div>
                    <div class="detail-row">
                        <span class="detail-key">Temporary Access Key</span>
                        <div class="detail-val" style="margin-top: 6px;"><span class="badge-pass">Digifort#Pass2026</span></div>
                    </div>
                </div>
                
                <div class="cta-container">
                    <a href="https://digifortlabs.com/login" class="btn-primary">Access Secure Dashboard &rarr;</a>
                </div>
                
                <div class="security-notice">
                    <strong>🔒 Security Reminder:</strong> This temporary key expires in 24 hours. Do not share these credentials with unauthorized personnel. Digifort Labs staff will never ask for your password.
                </div>
            </div>
            
            <div class="footer">
                <p style="margin: 0 0 6px 0;"><strong>Digifort Labs Pvt. Ltd.</strong> &bull; Empowering Healthcare Infrastructure</p>
                <p style="margin: 0;">Vapi &bull; Surat &bull; Ahmedabad &bull; Gujarat, India</p>
                <p style="margin-top: 12px; color: #cbd5e1;">Need help? Contact support at <a href="mailto:support@digifortlabs.com" class="footer-link">support@digifortlabs.com</a></p>
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
    print("[OK] Redesigned Executive Welcome email sent directly via SMTP server to 29keval@gmail.com!")

if __name__ == "__main__":
    send_premium_welcome()
