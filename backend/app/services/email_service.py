import logging
logger = logging.getLogger(__name__)
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.core.config import settings

import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # gets 'app' dir
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")

template_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"])
)

class EmailService:
    @staticmethod
    def _log_email(mail_type: str, category: str, sender_email: str, sender_name: str, recipient_email: str, subject: str, body_html: str, bcc: str = None, hospital_id: int = None):
        try:
            from app.database import SessionLocal
            from app.models import PlatformEmailLog
            db = SessionLocal()
            log = PlatformEmailLog(
                mail_type=mail_type,
                category=category,
                sender_email=sender_email,
                sender_name=sender_name,
                recipient_email=recipient_email,
                bcc=bcc,
                subject=subject,
                body_html=body_html,
                body_text=subject,
                status="SENT",
                hospital_id=hospital_id
            )
            db.add(log)
            db.commit()
            db.close()
        except Exception as ex:
            logger.error(f"[EMAIL LOGGING ERROR] {ex}")

    @staticmethod
    def _send_email(
        recipient: str, 
        subject: str, 
        template_name: str, 
        context: dict, 
        bcc: str = "info@digifortlabs.com, admin@digifortlabs.com",
        sender_name: str = "Digifort Labs",
        category: str = "GENERAL"
    ):
        """
        Private helper to render a template and send an email via SMTP.
        """
        try:
            # 1. Render Template
            context["current_year"] = datetime.now().year
            template = template_env.get_template(template_name)
            html_body = template.render(**context)

            # 2. Build Message
            msg = MIMEMultipart()
            msg['From'] = f"{sender_name} <{settings.SENDER_EMAIL}>"
            msg['To'] = recipient
            if bcc:
                msg['Bcc'] = bcc
            msg['Subject'] = subject
            msg['Date'] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S %z")
            msg['X-Mailer'] = "DigifortLabs Security Mailer 1.0"
            msg['Message-ID'] = f"<{datetime.now().timestamp()}@{settings.SMTP_SERVER}>"

            msg.attach(MIMEText(html_body, 'html'))

            # 3. Send Email
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            bcc_list = [addr.strip() for addr in bcc.split(",") if addr.strip()] if bcc else []
            recipients = [recipient] + bcc_list
            server.sendmail(settings.SENDER_EMAIL, recipients, msg.as_string())
            server.quit()
            
            # Log to DB Outbox
            EmailService._log_email("OUTBOX", category, settings.SENDER_EMAIL, sender_name, recipient, subject, html_body, bcc)
            
            return True
        except Exception as e:
            logger.info(f"[EMAIL SERVICE] Error sending email to {recipient}: {str(e)}")
            return False

    @staticmethod
    def send_login_alert(email: str, ip_address: str, device_info: str):
        """
        Sends a security alert email when a new login occurs.
        """
        context = {
            "title": "Security Alert: New Login",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "ip_address": ip_address,
            "device_info": device_info,
            "login_url": "https://digifortlabs.com/login"
        }
        
        return EmailService._send_email(
            recipient=email,
            subject="Security Alert: New Login Detected",
            template_name="email/login_alert.html",
            context=context,
            sender_name="Digifort Security"
        )

    @staticmethod
    def send_account_locked_email(email: str, reason: str):
        """
        Sends an account locked email.
        """
        context = {
            "reason": reason
        }
        return EmailService._send_email(
            recipient=email,
            subject="ACTION REQUIRED: Account Locked",
            template_name="email/account_locked.html",
            context=context,
            sender_name="Digifort Security"
        )

    @staticmethod
    def send_otp_email(email: str, otp_code: str):
        """
        Sends an OTP email using Jinja2 templates.
        """
        context = {
            "title": "Verification Code",
            "otp_code": otp_code
        }
        
        return EmailService._send_email(
            recipient=email,
            subject="Security Verification - Digifort Labs",
            template_name="email/otp.html",
            context=context,
            sender_name="Digifort Security"
        )

    @staticmethod
    def send_mfa_otp_email(email: str, otp_code: str, ip_address: str, device_info: str):
        """
        Sends an MFA OTP email for new device verification.
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
            msg['From'] = f"Digifort Security <{SENDER_EMAIL}>"
            msg['To'] = email
            msg['Subject'] = "Action Required: Verify New Device Link"
            msg['Date'] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S %z")
            msg['X-Mailer'] = "DigifortLabs Mailer 1.0"
            msg['Message-ID'] = f"<{datetime.now().timestamp()}@{settings.SMTP_SERVER}>"

            body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 40px auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }}
                    .otp-box {{ background: #f1f5f9; padding: 15px; text-align: center; margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #2563eb; border-radius: 8px; border: 1px dashed #cbd5e1; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 style="margin-top:0; color: #0f172a;">New Device Detected</h2>
                    <p>Hello,</p>
                    <p>You are attempting to log in from a new or unrecognized device. To verify your identity, please enter this One-Time Password:</p>
                    
                    <div class="otp-box">{otp_code}</div>
                    
                    <div style="background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 13px; margin: 20px 0;">
                        <strong>IP Address:</strong> {ip_address}<br>
                        <strong>Device Info:</strong> {device_info}<br>
                        <strong>Time:</strong> {timestamp}
                    </div>
                    
                    <p style="font-size: 13px; color: #64748b;">Code expires in 15 minutes. If this wasn't you, please change your password immediately.</p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SENDER_EMAIL, email, msg.as_string())
            server.quit()
            
            return True
        except Exception as e:
            logger.info(f"[EMAIL SERVICE] Failed to send MFA OTP to {email}: {str(e)}")
            logger.info("\n" + "="*60 + f"\n[EMAIL] [FALLBACK MFA OTP] {email} -> {otp_code}\n" + "="*60 + "\n")
            return False

    @staticmethod
    def send_welcome_email(email: str, name: str, password: str, login_url: str = None):
        """
        Sends a welcome email to new Hospital Admins with their initial credentials.
        """
        if not login_url:
            from app.core.config import settings
            login_url = f"{settings.FRONTEND_URL}/login"
            
        context = {
            "name": name,
            "password": password,
            "login_url": login_url
        }
        return EmailService._send_email(
            recipient=email,
            subject="Welcome to Digifort Labs - Your Account Credentials",
            template_name="email/welcome.html",
            context=context,
            sender_name="Digifort Labs"
        )

    @staticmethod
    def send_contact_form(name: str, email: str, message: str):
        """
        Sends a contact form submission to the admin and a confirmation to the user.
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
            # --- 1. ADMIN NOTIFICATION EMAIL ---
            admin_msg = MIMEMultipart()
            admin_msg['From'] = SENDER_EMAIL
            admin_msg['To'] = "info@digifortlabs.com"
            admin_msg['Subject'] = f"? New Inquiry: {name}"

            admin_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }}
                    .header {{ background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .field {{ margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; pb: 10px; }}
                    .label {{ font-weight: 700; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }}
                    .value {{ margin-top: 5px; color: #1e293b; font-size: 16px; }}
                    .footer {{ background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin:0; font-size: 20px;">New Website Inquiry</h2>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="label">From</div>
                            <div class="value">{name}</div>
                        </div>
                        <div class="field">
                            <div class="label">Email Address</div>
                            <div class="value"><a href="mailto:{email}" style="color: #2563eb; text-decoration: none;">{email}</a></div>
                        </div>
                        <div class="field">
                            <div class="label">Received At</div>
                            <div class="value">{timestamp}</div>
                        </div>
                        <div class="field" style="border-bottom: none;">
                            <div class="label">Message</div>
                            <div style="margin-top: 10px; padding: 15px; background: #f1f5f9; border-radius: 8px; font-style: italic;">
                                "{message}"
                            </div>
                        </div>
                    </div>
                    <div class="footer">
                        DIGIFORT LABS - INTERNAL NOTIFICATION
                    </div>
                </div>
            </body>
            </html>
            """
            admin_msg.attach(MIMEText(admin_body, 'html'))

            # --- 2. USER CONFIRMATION EMAIL ---
            user_msg = MIMEMultipart()
            user_msg['From'] = f"Digifort Labs <{SENDER_EMAIL}>"
            user_msg['To'] = email
            user_msg['Subject'] = "We've Received Your Inquiry - Digifort Labs"

            user_body = f"""
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
                    .specs {{ margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }}
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <h1 style="margin:0; font-size: 24px; letter-spacing: 1px;">DIGIFORT LABS</h1>
                        </div>
                        <div class="content">
                            <h2 style="color: #0f172a; margin-top: 0;">Hello {name},</h2>
                            <p>Thank you for reaching out to **Digifort Labs**. We have successfully received your inquiry regarding our records optimization services.</p>
                            <p>Our expert team is currently reviewing your message and will get back to you within 24 business hours.</p>
                            
                            <div class="specs">
                                <p style="margin-top: 0; font-weight: 600; color: #0f172a; font-size: 14px;">Summary of your message:</p>
                                <p style="font-size: 14px; color: #475569; margin-bottom: 0; font-style: italic;">"{message[:150] + '...' if len(message) > 150 else message}"</p>
                            </div>

                            <p style="margin-top: 30px;">In the meantime, feel free to visit our portal to explore our latest medical record management solutions.</p>
                            <a href="https://digifortlabs.com" class="button">Visit Our Website</a>
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
            user_msg.attach(MIMEText(user_body, 'html'))

            # --- SENDING ---
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            
            # Send To Admin (Info Email)
            server.sendmail(SENDER_EMAIL, "info@digifortlabs.com", admin_msg.as_string())
            
            # Send To User
            server.sendmail(SENDER_EMAIL, email, user_msg.as_string())
            
            server.quit()
            
            logger.info(f"[OK] [EMAIL SERVICE] Inquiry processed. Notification sent to Admin and Confirmation sent to {email}")
            return True

        except Exception as e:
            logger.info(f"[ERROR] [EMAIL SERVICE] Failed to process contact form: {str(e)}")
            return False

    @staticmethod
    def send_file_request_notification(to_email: str, subject: str, headline: str, message_content: str, box_label: str, requester: str):
        """
        Sends a notification email for file request status updates.
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
            msg['From'] = f"Digifort Logistics <{SENDER_EMAIL}>"
            msg['To'] = to_email
            msg['Bcc'] = "info@digifortlabs.com"
            msg['Subject'] = subject

            body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }}
                    .header {{ background: #4f46e5; color: #ffffff; padding: 30px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; }}
                    .label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }}
                    .value {{ font-size: 15px; font-weight: 600; color: #0f172a; margin-top: 2px; margin-bottom: 12px; }}
                    .status-badge {{ display: inline-block; padding: 6px 12px; border-radius: 20px; background: #e0e7ff; color: #4338ca; font-weight: 700; font-size: 14px; margin-bottom: 20px; }}
                    .footer {{ background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin:0; font-size: 24px;">File Request Update</h2>
                    </div>
                    <div class="content">
                        <div class="status-badge">{headline}</div>
                        <p>{message_content}</p>
                        
                        <div class="card">
                            <div class="label">Box Label</div>
                            <div class="value">? {box_label}</div>
                            
                            <div class="label">Requested By</div>
                            <div class="value">? {requester}</div>
                            
                            <div class="label">Timestamp</div>
                            <div class="value">? {timestamp}</div>
                        </div>
                        
                        <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
                            Please log in to the Digifort Dashboard for more details.
                        </p>
                    </div>
                    <div class="footer">
                        Digifort Labs Logistics System
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
            server.sendmail(SENDER_EMAIL, to_email, text)
            server.quit()
            
            logger.info(f"[EMAIL SERVICE] File Request Notification sent to {to_email}")
            return True

        except Exception as e:
            logger.info(f"[EMAIL SERVICE] Failed to send notification to {to_email}: {str(e)}")
            return False

    @staticmethod
    def send_invoice_email(recipient_email: str, hospital_name: str, invoice_number: str, amount: float, items: list, bank_details: dict = None, extra_details: dict = None):
        """
        Sends a professional tax-compliant invoice email matching the reference format.
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from datetime import datetime
        from app.core.config import settings

        SMTP_SERVER = settings.SMTP_SERVER
        SMTP_PORT = settings.SMTP_PORT
        SMTP_USERNAME = settings.SMTP_USERNAME
        SMTP_PASSWORD = settings.SMTP_PASSWORD
        SENDER_EMAIL = settings.SENDER_EMAIL

        ext = extra_details or {}
        amt_words = ext.get('amount_in_words', 'N/A')
        inv_period = ext.get('invoice_period', 'N/A')
        detailed_records = ext.get('detailed_records', [])

        bd = bank_details or {}
        customer_gstin = bd.get('customer_gst') or bd.get('gst') or 'URD'
        company_gstin = bd.get('company_gst') or '24AAFCD9999A1ZP'
        
        bank_name = bd.get('bank_name') or bd.get('name') or 'HDFC Bank'
        bank_branch = bd.get('bank_branch') or bd.get('branch') or ''
        full_bank_name = f"{bank_name} - {bank_branch}" if bank_branch else bank_name
        account_name = bd.get('account_name') or bd.get('company_name') or 'Digifort Labs Pvt. Ltd.'
        account_no = bd.get('account') or bd.get('bank_acc') or bd.get('account_no') or '50200012345678'
        ifsc_code = bd.get('ifsc') or bd.get('bank_ifsc') or 'HDFC0001234'
        company_pan = bd.get('pan') or bd.get('company_pan') or 'AAFCD9999A'

        bcc_emails = "info@digifortlabs.com, admin@digifortlabs.com"
        try:
            msg = MIMEMultipart()
            msg['From'] = f"Digifort Billing <{SENDER_EMAIL}>"
            msg['To'] = recipient_email
            msg['Bcc'] = bcc_emails
            msg['Subject'] = f"TAX INVOICE - {invoice_number} - Digifort Labs"

            # 1. Summary Items Rows - Grouping files into one line
            summary_rows = ""
            subtotal = 0
            
            non_file_items = [i for i in items if "Processing MRD:" not in i['description'] and i['description'] != "One-time Registration Fee"]
            file_items = [i for i in items if "Processing MRD:" in i['description']]
            reg_fee_item = next((i for i in items if i['description'] == "One-time Registration Fee"), None)
            
            display_idx = 1
            
            # Handle Registration Fee first if present
            if reg_fee_item:
                subtotal += reg_fee_item['amount']
                summary_rows += f"""
                <tr>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">{display_idx}</td>
                    <td style="padding: 10px; border: 1px solid #000;">{reg_fee_item['description']}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">{reg_fee_item.get('hsn', '998311')}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: right;">{reg_fee_item['amount']:,.2f}</td>
                </tr>
                """
                display_idx += 1
            
            # Handle Grouped Files
            if file_items:
                file_total = sum(i['amount'] for i in file_items)
                subtotal += file_total
                summary_rows += f"""
                <tr>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">{display_idx}</td>
                    <td style="padding: 10px; border: 1px solid #000;">Processing of {len(file_items)} Patient Records</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">998311</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: right;">{file_total:,.2f}</td>
                </tr>
                """
                display_idx += 1
                
            # Handle other custom items
            for item in non_file_items:
                subtotal += item['amount']
                summary_rows += f"""
                <tr>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">{display_idx}</td>
                    <td style="padding: 10px; border: 1px solid #000;">{item['description']}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: center;">{item.get('hsn', '998311')}</td>
                    <td style="padding: 10px; border: 1px solid #000; text-align: right;">{item['amount']:,.2f}</td>
                </tr>
                """
                display_idx += 1

            tax_9_percent = (subtotal * 9) / 100
            grand_total = subtotal + (tax_9_percent * 2)

            # 2. Detailed Patient Records Rows
            patient_rows = ""
            for idx, rec in enumerate(detailed_records):
                patient_rows += f"""
                <tr>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">{idx+1}</td>
                    <td style="padding: 8px; border: 1px solid #000;">FILE-{rec.get('file_id')}</td>
                    <td style="padding: 8px; border: 1px solid #000;">{rec.get('mrd_id', 'N/A')}</td>
                    <td style="padding: 8px; border: 1px solid #000;">{rec.get('name', 'Unknown')}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">{rec.get('admission_date', 'N/A')}</td>
                    <td style="padding: 8px; border: 1px solid #000; text-align: center;">{rec.get('pages', 0)}</td>
                </tr>
                """

            body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; color: #000; font-size: 13px; margin: 0; padding: 20px; }}
                    .main-container {{ width: 100%; max-width: 800px; margin: auto; border: 2px solid #000; padding: 0; }}
                    .invoice-header {{ background-color: #d1d5db; text-align: center; font-weight: bold; font-size: 18px; padding: 10px; border-bottom: 1px solid #000; border-top: 1px solid #000; }}
                    .info-grid {{ width: 100%; border-collapse: collapse; }}
                    .info-grid td {{ border: 1px solid #000; padding: 15px; vertical-align: top; width: 50%; }}
                    .table-header {{ background-color: #d1d5db; font-weight: bold; text-align: center; }}
                    .summary-table {{ width: 100%; border-collapse: collapse; }}
                    .summary-table th, .summary-table td {{ border: 1px solid #000; padding: 10px; }}
                    .details-label {{ font-weight: bold; display: inline-block; width: 130px; }}
                    .totals-box {{ text-align: right; border-top: none !important; }}
                    .bank-box {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                    .bank-box td {{ border: 1px solid #000; padding: 15px; }}
                </style>
            </head>
            <body>
                <div class="main-container">
                    <!-- Brand Header -->
                    <div style="padding: 20px; height: 80px;">
                        <div style="float: left;">
                            <img src="https://digifortlabs.com/l.webp" height="60" alt="Digifort Logo">
                            <p style="margin: 5px 0 0 0; font-size: 10px; color: #4338ca; font-weight: bold;">Empowering Healthcare Providers and Patients</p>
                        </div>
                        <div style="float: right; text-align: right;">
                            <h2 style="margin:0; font-size: 16px;">{account_name}</h2>
                            <p style="margin: 5px 0; font-size: 11px;">
                                A-502, Tech Park, GIDC Estate,<br>
                                Vapi 396191, Gujarat.
                            </p>
                        </div>
                        <div style="clear: both;"></div>
                    </div>

                    <div class="invoice-header">TAX INVOICE</div>

                    <table class="info-grid">
                        <tr>
                            <td>
                                <strong style="font-size: 15px;">Bill To Party</strong><br><br>
                                <div style="font-weight: bold; font-size: 14px;">{hospital_name}</div>
                                <div style="margin-top: 5px;">
                                    <strong>GSTIN :</strong> {customer_gstin}<br>
                                    <strong>State :</strong> Gujarat &nbsp;&nbsp; <strong>Code :</strong> 24
                                </div>
                            </td>
                            <td>
                                <strong style="font-size: 15px;">Details</strong><br><br>
                                <div><span class="details-label">Invoice No. :</span> <strong>{invoice_number}</strong></div>
                                <div><span class="details-label">Date of Invoice :</span> {datetime.now().strftime("%d-%m-%Y")}</div>
                                <div><span class="details-label">Due Date :</span> {datetime.now().strftime("%d-%m-%Y")}</div>
                                <div><span class="details-label">Invoice period :</span> {inv_period}</div>
                                <div><span class="details-label">Company's GSTIN :</span> {company_gstin}</div>
                                <div><span class="details-label">State :</span> Gujarat &nbsp;&nbsp; <strong>Code :</strong> 24</div>
                            </td>
                        </tr>
                    </table>

                    <div class="table-header" style="padding: 10px; border-bottom: 1px solid #000;">Summary Table for all charges</div>
                    
                    <table class="summary-table">
                        <tr style="background-color: #d1d5db;">
                            <th style="width: 60px;">Item #</th>
                            <th>Chargeable Item</th>
                            <th style="width: 100px;">HSN/SAC code</th>
                            <th style="width: 120px;">Amount(Rs.)</th>
                        </tr>
                        {summary_rows}
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Sub. Total(Excl. of taxes) :</td>
                            <td style="text-align: right; font-weight: bold;">Rs.{subtotal:,.2f}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: right;">Central GST @ 9.00% :</td>
                            <td style="text-align: right;">Rs.{tax_9_percent:,.2f}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align: right;">State GST @ 9.00% :</td>
                            <td style="text-align: right;">Rs.{tax_9_percent:,.2f}</td>
                        </tr>
                        <tr style="background-color: #fef08a;">
                            <td colspan="3" style="text-align: right; font-weight: bold; font-size: 14px;">Total Amount after Tax :</td>
                            <td style="text-align: right; font-weight: bold; font-size: 14px;">Rs.{grand_total:,.2f}</td>
                        </tr>
                        <tr>
                            <td colspan="4" style="padding: 15px;">
                                <strong>Total Invoice amount in words :</strong> {amt_words}
                            </td>
                        </tr>
                    </table>

                    <table class="bank-box">
                        <tr>
                            <td style="width: 65%;">
                                <strong style="font-size: 14px; text-transform: uppercase;">BANK DETAILS</strong><br><br>
                                <strong>Bank Name :</strong> {full_bank_name}<br>
                                <strong>Account Name :</strong> {account_name}<br>
                                <strong>Account No. :</strong> {account_no}<br>
                                <strong>IFSC CODE :</strong> {ifsc_code}<br>
                                <strong>Company's PAN :</strong> {company_pan}
                            </td>
                            <td style="text-align: center;">
                                <strong>Common Seal</strong><br><br><br><br>
                            </td>
                        </tr>
                    </table>
                    
                    <div style="padding: 20px; font-size: 11px; line-height: 1.5;">
                        *This is a computer generated invoice.<br>
                        *Please contact Digifort Labs customer care for more information at care@digifortlabs.com<br>
                        *Cheque payable to 'Digifort Labs Pvt. Ltd.'<br>
                        *Late charge of 5% of the invoice amount would be levied on invoices which are due for more than 15 days from the date of issue
                    </div>

                    <div style="text-align: center; padding: 20px; font-weight: bold; border-top: 1px solid #000;">
                        Thank you for using Digifort Labs - Empowering Healthcare Providers and Patients
                    </div>
                </div>

                <!-- Detailed Records Table (Page 2 Style) -->
                <div style="margin-top: 40px; border: 2px solid #000; max-width: 800px; margin-left: auto; margin-right: auto;">
                    <div class="table-header" style="padding: 15px; font-size: 16px;">Invoiced Record Details Summary</div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background-color: #d1d5db; font-weight: bold;">
                            <th style="padding: 10px; border: 1px solid #000;">Sr. No</th>
                            <th style="padding: 10px; border: 1px solid #000;">Record Id</th>
                            <th style="padding: 10px; border: 1px solid #000;">MRD No.</th>
                            <th style="padding: 10px; border: 1px solid #000;">Name of Patient</th>
                            <th style="padding: 10px; border: 1px solid #000;">Admission Date</th>
                            <th style="padding: 10px; border: 1px solid #000;">Pages</th>
                        </tr>
                        {patient_rows}
                    </table>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            text = msg.as_string()
            all_recipients = [recipient_email, "info@digifortlabs.com", "admin@digifortlabs.com"]
            server.sendmail(SENDER_EMAIL, all_recipients, text)
            server.quit()
            
            # Log to PlatformEmailLog Outbox
            EmailService._log_email("OUTBOX", "TAX_INVOICE", SENDER_EMAIL, "Digifort Billing", recipient_email, msg['Subject'], body, bcc_emails)
            
            logger.info(f"[OK] [EMAIL SERVICE] Professional Invoice {invoice_number} sent to {recipient_email}")
            return True

        except Exception as e:
            logger.info(f"[ERROR] [EMAIL SERVICE] Failed to send invoice to {recipient_email}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    @staticmethod
    def send_file_retrieval_success_email(recipient_email: str, hospital_name: str, patient_name: str, mrd_number: str, filename: str, file_content: bytes):
        """
        Sends a retrieved archival file as an attachment.
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.mime.application import MIMEApplication
        from datetime import datetime
        from app.core.config import settings

        SMTP_SERVER = settings.SMTP_SERVER
        SMTP_PORT = settings.SMTP_PORT
        SMTP_USERNAME = settings.SMTP_USERNAME
        SMTP_PASSWORD = settings.SMTP_PASSWORD
        SENDER_EMAIL = settings.SENDER_EMAIL

        try:
            msg = MIMEMultipart()
            msg['From'] = f"Digifort Archive <{SENDER_EMAIL}>"
            msg['To'] = recipient_email
            msg['Bcc'] = "info@digifortlabs.com"
            msg['Subject'] = f"RETRIEVED RECORD: {patient_name} ({mrd_number})"

            body = f"""
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #1e293b; color: #fff; padding: 25px; text-align: center;">
                        <h2 style="margin: 0;">Digifort Archive Service</h2>
                    </div>
                    <div style="padding: 30px;">
                        <p>Hello <strong>{hospital_name} Admin</strong>,</p>
                        <p>Your request to retrieve an archived medical record has been processed successfully.</p>
                        
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <p style="margin: 0 0 10px 0;"><strong>Patient Record Details:</strong></p>
                            <table style="width: 100%; font-size: 14px;">
                                <tr><td style="color: #64748b; width: 120px;">Patient Name:</td><td>{patient_name}</td></tr>
                                <tr><td style="color: #64748b;">MRD Number:</td><td>{mrd_number}</td></tr>
                                <tr><td style="color: #64748b;">Filename:</td><td>{filename}</td></tr>
                            </table>
                        </div>

                        <p>The requested file is attached to this email. For security reasons, please ensure this record is stored in compliance with medical data privacy regulations.</p>
                        
                        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                            Thank you for using Digifort Labs Archive Management.
                        </p>
                    </div>
                    <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
                        &copy; {datetime.now().year} Digifort Labs. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
            """
            msg.attach(MIMEText(body, 'html'))

            # Attachment
            part = MIMEApplication(file_content, Name=filename)
            part['Content-Disposition'] = f'attachment; filename="{filename}"'
            msg.attach(part)

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
            server.quit()
            
            logger.info(f"[OK] [EMAIL SERVICE] Retrieved file sent to {recipient_email}")
            return True

        except Exception as e:
            logger.info(f"[ERROR] [EMAIL SERVICE] Failed to send retrieved file to {recipient_email}: {str(e)}")
            return False

    @staticmethod
    def send_download_request_email(custom_email: str, admin_email: str, hospital_name: str, patient_name: str, mrd_id: str, filename: str, requester_email: str):
        """
        Sends a download request notification to a custom email with hospital admin in CC.
        """
        context = {
            "title": "Record Access Request",
            "hospital_name": hospital_name,
            "patient_name": patient_name,
            "mrd_id": mrd_id,
            "filename": filename,
            "requester_email": requester_email,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return EmailService._send_email(
            recipient=custom_email,
            subject=f"DOWNLOAD REQUEST: {patient_name} - {hospital_name}",
            template_name="email/download_request.html",
            context=context,
            bcc=admin_email,
            sender_name="Digifort Request"
        )

    @staticmethod
    def send_email_update_notification(old_email: str, new_email: str, name: str):
        """
        Sends a notification to BOTH old and new emails about the change.
        """
        context = {
            "title": "Account Email Updated",
            "name": name,
            "old_email": old_email,
            "new_email": new_email
        }
        
        # Send to new email
        success_new = EmailService._send_email(
            recipient=new_email,
            subject="Security Alert: Account Email Updated",
            template_name="email/email_change_alert.html",
            context=context,
            sender_name="Digifort Security"
        )
        
        # Send to old email
        success_old = EmailService._send_email(
            recipient=old_email,
            subject="Security Alert: Account Email Updated",
            template_name="email/email_change_alert.html",
            context=context,
            sender_name="Digifort Security"
        )
        
        return success_new and success_old

    @staticmethod
    def send_download_delivery_email(
        recipient_email: str, 
        admin_email: str, 
        hospital_name: str, 
        patient_name: str, 
        mrd_id: str, 
        filename: str, 
        requester_name: str,
        ip_address: str,
        file_content: bytes
    ):
        """
        Deliver a requested file via email attachment with audit details.
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.mime.base import MIMEBase
        from email import encoders
        from datetime import datetime
        from app.core.config import settings

        SMTP_SERVER = settings.SMTP_SERVER
        SMTP_PORT = settings.SMTP_PORT
        SMTP_USERNAME = settings.SMTP_USERNAME
        SMTP_PASSWORD = settings.SMTP_PASSWORD
        # Delivery From info@ account as per user request
        SENDER_EMAIL = "info@digifortlabs.com"

        try:
            if not SMTP_SERVER or not SMTP_USERNAME:
                logger.info(f"[WARN] [EMAIL SERVICE] SMTP not configured. Mocking delivery to {recipient_email}")
                return True

            msg = MIMEMultipart()
            msg['From'] = f"Digifort Delivery <{SENDER_EMAIL}>"
            msg['To'] = recipient_email
            if admin_email and admin_email != recipient_email:
                msg['Cc'] = admin_email
            msg['Subject'] = f"MEDICAL RECORD DELIVERY: {patient_name} ({filename})"

            body = f"""
            <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background: #10b981; color: #fff; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Medical Record Delivery</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hello,</p>
                        <p>The requested medical record is attached to this email.</p>
                        
                        <div style="background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p><strong>Hospital:</strong> {hospital_name}</p>
                            <p><strong>Patient:</strong> {patient_name} (MRD: {mrd_id})</p>
                            <p><strong>File Name:</strong> {filename}</p>
                            <p><strong>Requested By:</strong> {requester_name} ({recipient_email})</p>
                            <p><strong>Request IP:</strong> {ip_address}</p>
                            <p><strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;"><strong>Security Notice:</strong> This document contains sensitive health information. Please ensure it is handled in compliance with local regulations.</p>
                    </div>
                    <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        This is an automated delivery from Digifort Labs Platform.
                    </div>
                </div>
            </body>
            </html>
            """
            msg.attach(MIMEText(body, 'html'))

            # Attachment handling
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(file_content)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
            msg.attach(part)

            recipients = [recipient_email]
            if admin_email and admin_email != recipient_email:
                recipients.append(admin_email)

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, recipients, msg.as_string())
            server.quit()
            
            logger.info(f"[OK] [EMAIL SERVICE] File delivered to {recipient_email} (CC: {admin_email})")
            return True
        except Exception as e:
            logger.info(f"[ERROR] [EMAIL SERVICE] Delivery failed: {e}")
            return False

    @staticmethod
    def send_retrieval_initiated_email(email: str, patient_name: str, filename: str, hospital_name: str):
        """
        Notify user that restoration from archive has started (3-5 hour process).
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from datetime import datetime
        from app.core.config import settings

        SMTP_SERVER = settings.SMTP_SERVER
        SMTP_PORT = settings.SMTP_PORT
        SMTP_USERNAME = settings.SMTP_USERNAME
        SMTP_PASSWORD = settings.SMTP_PASSWORD
        SENDER_EMAIL = settings.SENDER_EMAIL

        try:
            msg = MIMEMultipart()
            msg['From'] = f"Digifort Archive <{SENDER_EMAIL}>"
            msg['To'] = email
            msg['Subject'] = f"Restoration Started: {patient_name} ({filename})"

            body = f"""
            <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background: #3b82f6; color: #fff; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Archive Retrieval Started</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hello,</p>
                        <p>We have received your request to retrieve a medical record from the long-term archive.</p>
                        
                        <div style="background: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                            <p><strong>Patient:</strong> {patient_name}</p>
                            <p><strong>File Name:</strong> {filename}</p>
                            <p><strong>Hospital:</strong> {hospital_name}</p>
                            <p><strong>Estimated Time:</strong> 3-5 Hours (Standard Archive Tier)</p>
                        </div>
                        
                        <p><strong>What's next?</strong></p>
                        <p>AWS is currently moving the file from cold storage to active storage. Once the process is complete, you will receive another email with the secure document attached.</p>
                        
                        <p style="font-size: 14px; color: #666;">No further action is required from your side at this time.</p>
                    </div>
                    <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        Digifort Labs Archive Management System
                    </div>
                </div>
            </body>
            </html>
            """
            msg.attach(MIMEText(body, 'html'))

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [email], msg.as_string())
            server.quit()
            
            logger.info(f"[OK] [EMAIL SERVICE] Retrieval initiated email sent to {email}")
            return True
        except Exception as e:
            logger.info(f"[ERROR] [EMAIL SERVICE] Initiation notification failed: {e}")
            return False

    @staticmethod
    def send_file_retrieval_success_email(recipient_email: str, hospital_name: str, patient_name: str, mrd_number: str, filename: str, file_content: bytes):
        """
        Deliver the file once restoration is complete.
        """
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.mime.base import MIMEBase
        from email import encoders
        from datetime import datetime
        from app.core.config import settings

        SMTP_SERVER = settings.SMTP_SERVER
        SMTP_PORT = settings.SMTP_PORT
        SMTP_USERNAME = settings.SMTP_USERNAME
        SMTP_PASSWORD = settings.SMTP_PASSWORD
        SENDER_EMAIL = settings.SENDER_EMAIL

        try:
            msg = MIMEMultipart()
            msg['From'] = f"Digifort Delivery <{SENDER_EMAIL}>"
            msg['To'] = recipient_email
            msg['Subject'] = f"Archive Retrieval Complete: {patient_name}"

            body = f"""
            <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <div style="background: #10b981; color: #fff; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Restoration Complete</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hello,</p>
                        <p>The medical record you requested from the archive has been successfully restored and is attached to this email.</p>
                        
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p><strong>Hospital:</strong> {hospital_name}</p>
                            <p><strong>Patient:</strong> {patient_name} (MRD: {mrd_number})</p>
                            <p><strong>File Name:</strong> {filename}</p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">This file will remain available for direct viewing in the dashboard for the next 24 hours.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            msg.attach(MIMEText(body, 'html'))

            part = MIMEBase('application', 'octet-stream')
            part.set_payload(file_content)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
            msg.attach(part)

            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [recipient_email], msg.as_string())
            server.quit()
            
            logger.info(f"[OK] [EMAIL SERVICE] Retrieval success email delivered to {recipient_email}")
            return True
        except Exception as e:
            logger.info(f"[ERROR] [EMAIL SERVICE] Success notification failed: {e}")
            return False

    @staticmethod
    def send_demo_credentials_email(email: str, password: str, slug: str = None):
        context = {
            "email": email,
            "password": password,
            "slug": slug
        }
        return EmailService._send_email(
            recipient=email,
            subject="Demo Account Created - Digifort Labs",
            template_name="email/demo_credentials.html",
            context=context,
            sender_name="Digifort Labs"
        )
