
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
        print(f"[MOCK EMAIL SERVICE] Security Alert for: {email}")
        print(f"Time: {timestamp}")
        print("Details: New Login detected.")
        print(f"IP Address: {ip_address}")
        print(f"Device: {device_info}")
        print("Action: If this was not you, please contact support immediately.")
        print("="*60 + "\n")
        
        return True

        return True

    @staticmethod
    def send_account_locked_email(email: str, reason: str):
        """
        Simulates sending an account locked email.
        Non-blocking mock for now to prevent login freeze.
        """
        print(f"[MOCK EMAIL SERVICE] Account Locked: {email} | Reason: {reason}")
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
            
            print(f"[EMAIL SERVICE] OTP Sent to {email}")
            return True
        except Exception as e:
            print(f"[EMAIL SERVICE] Failed to send OTP to {email}: {str(e)}")
            # FALLBACK FOR LOCAL TESTING
            print("\n" + "="*60)
            print(f"📧 [FALLBACK] OTP for {email}: {otp_code}")
            print("="*60 + "\n")
            return False

    @staticmethod
    def send_welcome_email(email: str, name: str, password: str, login_url: str = None):
        """
        Sends a welcome email to new Hospital Admins with their initial credentials.
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

        if not login_url:
            login_url = f"{settings.FRONTEND_URL}/login"

        try:
            msg = MIMEMultipart()
            msg['From'] = f"Digifort Labs <{SENDER_EMAIL}>"
            msg['To'] = email
            msg['Subject'] = "Welcome to Digifort Labs - Your Account Credentials"

            body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }}
                    .header {{ background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }}
                    .content {{ padding: 30px; }}
                    .card {{ background: #f0fdf4; border: 1px dashed #22c55e; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center; }}
                    .password {{ font-family: monospace; font-size: 24px; letter-spacing: 2px; font-weight: 700; color: #15803d; background: #ffffff; padding: 10px 20px; border-radius: 6px; display: inline-block; margin: 10px 0; border: 1px solid #bbf7d0; }}
                    .btn {{ display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px; }}
                    .footer {{ background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin:0; font-size: 24px;">Welcome on Board! 🚀</h2>
                    </div>
                    <div class="content">
                        <p style="font-size: 16px;">Hello <strong>{name}</strong>,</p>
                        <p>Your hospital account has been successfully created on the Digifort Labs platform.</p>
                        <p>Here are your one-time login credentials. Please log in and change your password immediately.</p>
                        
                        <div class="card">
                            <div style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 5px;">Your One-Time Password</div>
                            <div class="password">{password}</div>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="{login_url}" class="btn">Log In to Dashboard</a>
                        </div>
                        
                        <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                            If the button above doesn't work, copy and paste this link into your browser:<br>
                            <a href="{login_url}" style="color: #2563eb;">{login_url}</a>
                        </p>
                    </div>
                    <div class="footer">
                        Digifort Labs - Secure Records Management
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
            
            print(f"[EMAIL SERVICE] Welcome Email sent to {email}")
            return True

        except Exception as e:
            print(f"[EMAIL SERVICE] Failed to send welcome email to {email}: {str(e)}")
            return False

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
            admin_msg['To'] = SENDER_EMAIL
            admin_msg['Subject'] = f"🔥 New Inquiry: {name}"

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
            
            # Send To Admin
            server.sendmail(SENDER_EMAIL, SENDER_EMAIL, admin_msg.as_string())
            
            # Send To User
            server.sendmail(SENDER_EMAIL, email, user_msg.as_string())
            
            server.quit()
            
            print(f"✅ [EMAIL SERVICE] Inquiry processed. Notification sent to Admin and Confirmation sent to {email}")
            return True

        except Exception as e:
            print(f"❌ [EMAIL SERVICE] Failed to process contact form: {str(e)}")
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
                            <div class="value">📦 {box_label}</div>
                            
                            <div class="label">Requested By</div>
                            <div class="value">👤 {requester}</div>
                            
                            <div class="label">Timestamp</div>
                            <div class="value">🕒 {timestamp}</div>
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
            
            print(f"[EMAIL SERVICE] File Request Notification sent to {to_email}")
            return True

        except Exception as e:
            print(f"[EMAIL SERVICE] Failed to send notification to {to_email}: {str(e)}")
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

        try:
            msg = MIMEMultipart()
            msg['From'] = f"Digifort Billing <{SENDER_EMAIL}>"
            msg['To'] = recipient_email
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
                            <h2 style="margin:0; font-size: 16px;">Digifort Labs Pvt. Ltd.</h2>
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
                                    <strong>GSTIN :</strong> {bank_details.get('gst') if bank_details else 'URD'}<br>
                                    <strong>State :</strong> Gujarat &nbsp;&nbsp; <strong>Code :</strong> 24
                                </div>
                            </td>
                            <td>
                                <strong style="font-size: 15px;">Details</strong><br><br>
                                <div><span class="details-label">Invoice No. :</span> <strong>{invoice_number}</strong></div>
                                <div><span class="details-label">Date of Invoice :</span> {datetime.now().strftime("%d-%m-%Y")}</div>
                                <div><span class="details-label">Due Date :</span> {datetime.now().strftime("%d-%m-%Y")}</div>
                                <div><span class="details-label">Invoice period :</span> {inv_period}</div>
                                <div><span class="details-label">Company's GSTIN :</span> 24AAFCD9999A1ZP</div>
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
                                <strong>Bank Name :</strong> HDFC Bank - Tech Park Branch<br>
                                <strong>Account Name. :</strong> Digifort Labs Pvt. Ltd.<br>
                                <strong>Account No. :</strong> 50200012345678<br>
                                <strong>IFSC CODE :</strong> HDFC0001234<br>
                                <strong>Company's PAN :</strong> AAFCD9999A
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
            server.sendmail(SENDER_EMAIL, recipient_email, text)
            server.quit()
            
            print(f"✅ [EMAIL SERVICE] Professional Invoice {invoice_number} sent to {recipient_email}")
            return True

        except Exception as e:
            print(f"❌ [EMAIL SERVICE] Failed to send invoice to {recipient_email}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
