import os
import logging
from datetime import datetime
from typing import Optional, Any, cast
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    Hospital, Patient, PatientInvoice, PatientInvoiceItem,
    OPDVisit, DentalTreatment, IPDAdmission, User
)
from app.services.email_service import EmailService

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import A4 # type: ignore
from reportlab.lib import colors # type: ignore
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle # type: ignore
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle # type: ignore
from reportlab.lib.units import inch # type: ignore

logger = logging.getLogger(__name__)

class PatientBillingService:
    @staticmethod
    def get_unbilled_records(db: Session, hospital_id: int, patient_id: int):
        """
        Retrieves all unbilled OPD Visits, Dental Treatments, and IPD Admissions
        for a given patient.
        """
        # 1. Fetch unbilled OPD visits
        opd_visits = db.query(OPDVisit).filter(
            OPDVisit.patient_id == patient_id,
            OPDVisit.hospital_id == hospital_id,
            OPDVisit.patient_invoice_id is None,
            OPDVisit.consultation_fee > 0
        ).order_by(OPDVisit.visit_date.desc()).all()

        # 2. Fetch unbilled Dental treatments
        dental_treatments = db.query(DentalTreatment).filter(
            DentalTreatment.patient_id == patient_id,
            DentalTreatment.patient_invoice_id is None,
            DentalTreatment.cost > 0
        ).order_by(DentalTreatment.date_performed.desc()).all()

        # 3. Fetch unbilled IPD Admissions
        # Note: both discharged and active admissions can be billed.
        ipd_admissions = db.query(IPDAdmission).filter(
            IPDAdmission.patient_id == patient_id,
            IPDAdmission.hospital_id == hospital_id,
            IPDAdmission.patient_invoice_id is None
        ).order_by(IPDAdmission.admission_date.desc()).all()

        return {
            "opd_visits": opd_visits,
            "dental_treatments": dental_treatments,
            "ipd_admissions": ipd_admissions
        }

    @staticmethod
    def create_invoice(
        db: Session,
        hospital_id: int,
        patient_id: int,
        items_data: list,  # list of dict: {description, qty, unit_price, discount, charge_type, reference_id}
        discount_amount: float = 0.0,
        gst_rate: float = 18.0,
        payment_method: str = "CASH",
        transaction_id: Optional[str] = None,
        remarks: Optional[str] = None,
        created_by: Optional[int] = None,
        due_date: Optional[datetime] = None
    ) -> PatientInvoice:
        """
        Manually compiles and creates a patient invoice.
        Links and marks the source visits, treatments, and stays as billed.
        """
        # Calculate subtotal and item amounts
        subtotal = 0.0
        invoice_items = []
        
        for item in items_data:
            qty = item.get("qty", 1)
            unit_price = item.get("unit_price", 0.0)
            item_discount = item.get("discount", 0.0)
            net_amount = (qty * unit_price) - item_discount
            subtotal += net_amount
            
            invoice_items.append(
                PatientInvoiceItem(
                    description=item["description"],
                    qty=qty,
                    unit_price=unit_price,
                    discount=item_discount,
                    amount=net_amount,
                    charge_type=item.get("charge_type", "CUSTOM"),
                    reference_id=item.get("reference_id")
                )
            )

        # Tax and total calculations
        tax_amount = round((subtotal * gst_rate) / 100.0, 2)
        total_amount = round(subtotal - discount_amount + tax_amount)

        # Generate unique invoice number
        # Format: DFL-PAT/{hospital_id}/{year}/{seq}
        year = datetime.now().strftime("%Y-%m")
        count = db.query(PatientInvoice).filter(
            PatientInvoice.hospital_id == hospital_id
        ).count()
        invoice_number = f"INV-PAT-{hospital_id}-{year}-{1001 + count}"

        # Create Invoice
        invoice = PatientInvoice(
            hospital_id=hospital_id,
            patient_id=patient_id,
            invoice_number=invoice_number,
            subtotal=subtotal,
            discount_amount=discount_amount,
            gst_rate=gst_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status="PAID" if payment_method in ["CASH", "CARD", "QR_CODE", "VOUCHER", "GOVT_SCHEME"] else "PENDING",
            payment_method=payment_method,
            transaction_id=transaction_id,
            remarks=remarks,
            created_by=created_by,
            due_date=due_date,
            bill_date=datetime.now()
        )
        
        # Add items
        invoice.items = invoice_items
        db.add(invoice)
        db.flush()  # Populates invoice.invoice_id

        # Link clinical items and mark as paid/billed
        for item in invoice_items:
            ref_id = item.reference_id
            if not ref_id:
                continue
                
            if item.charge_type == "OPD_VISIT":
                visit = db.query(OPDVisit).filter(OPDVisit.visit_id == ref_id).first()
                if visit:
                    visit.patient_invoice_id = invoice.invoice_id # type: ignore
                    visit.is_paid = True # type: ignore
            elif item.charge_type == "DENTAL_TREATMENT":
                treatment = db.query(DentalTreatment).filter(DentalTreatment.treatment_id == ref_id).first()
                if treatment:
                    treatment.patient_invoice_id = invoice.invoice_id # type: ignore
                    treatment.status = "completed" # type: ignore
            elif item.charge_type == "IPD_ADMISSION":
                admission = db.query(IPDAdmission).filter(IPDAdmission.admission_id == ref_id).first()
                if admission:
                    admission.patient_invoice_id = invoice.invoice_id # type: ignore

        # Update legacy patient total_bill_amount
        patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
        if patient:
            patient.total_bill_amount = (patient.total_bill_amount or 0.0) + total_amount # type: ignore

        db.commit()
        db.refresh(invoice)

        # Generate PDF asynchronously / on-demand
        try:
            PatientBillingService.generate_pdf_file(invoice, db)
        except Exception as e:
            logger.error(f"Failed to generate invoice PDF on creation: {str(e)}")

        return invoice

    @staticmethod
    def generate_pdf_file(invoice: PatientInvoice, db: Session) -> str:
        """
        Generates a high-quality A4 PDF invoice on the server filesystem.
        """
        os.makedirs("local_storage/patient_invoices", exist_ok=True)
        filename = f"invoice_{invoice.invoice_number.replace('/', '_')}.pdf"
        file_path = os.path.join("local_storage/patient_invoices", filename)

        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'NormalStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )
        
        bold_style = ParagraphStyle(
            'BoldStyle',
            parent=normal_style,
            fontName='Helvetica-Bold'
        )
        
        table_header_style = ParagraphStyle(
            'TableHeaderStyle',
            parent=normal_style,
            fontName='Helvetica-Bold',
            textColor=colors.white
        )

        story: list[Any] = []

        hospital = invoice.hospital
        patient = invoice.patient

        # 1. Header Info (Hospital & Invoice details side by side)
        header_data = [
            [
                Paragraph(f"<b>{hospital.legal_name}</b><br/>{hospital.address or ''}<br/>{hospital.city or ''}, {hospital.state or ''} {hospital.pincode or ''}<br/>Phone: {hospital.phone or '-'}<br/>Email: {hospital.email or '-'}", normal_style),
                Paragraph(f"<font size=14><b>PATIENT INVOICE</b></font><br/><br/><b>Invoice No:</b> {invoice.invoice_number}<br/><b>Date:</b> {invoice.bill_date.strftime('%d-%b-%Y %I:%M %p')}<br/><b>Status:</b> {invoice.status}<br/><b>GSTIN:</b> {hospital.gst_number or 'URD'}", normal_style)
            ]
        ]
        
        header_table = Table(header_data, colWidths=[260, 260])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 15))

        # 2. Patient Details Panel
        patient_data = [
            [
                Paragraph("<b>Billed To (Patient):</b>", bold_style),
                Paragraph(f"<b>MRD Number:</b> {patient.patient_u_id}", normal_style)
            ],
            [
                Paragraph(f"Name: {patient.full_name}", normal_style),
                Paragraph(f"Age / Gender: {patient.age or '-'} / {patient.gender or '-'}", normal_style)
            ],
            [
                Paragraph(f"Contact: {patient.phone or '-'}", normal_style),
                Paragraph(f"Admitted Date: {patient.admission_date.strftime('%d-%b-%Y') if patient.admission_date else '-'}", normal_style)
            ]
        ]
        patient_table = Table(patient_data, colWidths=[260, 260])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(patient_table)
        story.append(Spacer(1, 20))

        # 3. Itemized Charges Table
        table_data = [[
            Paragraph("Sr.", table_header_style),
            Paragraph("Description", table_header_style),
            Paragraph("Charge Type", table_header_style),
            Paragraph("Qty", table_header_style),
            Paragraph("Unit Price (₹)", table_header_style),
            Paragraph("Disc (₹)", table_header_style),
            Paragraph("Amount (₹)", table_header_style),
        ]]

        for idx, item in enumerate(list(invoice.items)): # type: ignore
            table_data.append([
                Paragraph(str(idx + 1), normal_style),
                Paragraph(item.description, normal_style),
                Paragraph(item.charge_type, normal_style),
                Paragraph(str(item.qty), normal_style),
                Paragraph(f"{item.unit_price:,.2f}", normal_style),
                Paragraph(f"{item.discount:,.2f}", normal_style),
                Paragraph(f"{item.amount:,.2f}", normal_style),
            ])

        charges_table = Table(table_data, colWidths=[30, 180, 80, 40, 65, 55, 70])
        charges_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        story.append(charges_table)
        story.append(Spacer(1, 15))

        # 4. Totals Block
        total_data = [
            [Paragraph("", normal_style), Paragraph("Subtotal:", bold_style), Paragraph(f"₹ {invoice.subtotal:,.2f}", normal_style)],
            [Paragraph("", normal_style), Paragraph(f"GST ({invoice.gst_rate}%):", bold_style), Paragraph(f"₹ {invoice.tax_amount:,.2f}", normal_style)],
            [Paragraph("", normal_style), Paragraph("Overall Discount:", bold_style), Paragraph(f"- ₹ {invoice.discount_amount:,.2f}", normal_style)],
            [Paragraph("", normal_style), Paragraph("Total Payable:", bold_style), Paragraph(f"<b>₹ {invoice.total_amount:,.2f}</b>", bold_style)],
        ]
        
        total_table = Table(total_data, colWidths=[320, 100, 100])
        total_table.setStyle(TableStyle([
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
            ('PADDING', (0,0), (-1,-1), 4),
            ('LINEBELOW', (1,2), (2,2), 1, colors.HexColor('#e2e8f0')),
            ('BACKGROUND', (1,3), (2,3), colors.HexColor('#f1f5f9')),
        ]))
        story.append(total_table)
        story.append(Spacer(1, 20))

        # 5. Terms & Guidelines
        guidelines_text = (
            "<b>Payment Guidelines:</b><br/>"
            f"1. Payment Mode: {invoice.payment_method or 'CASH'}"
            f"{' | Txn ID: ' + invoice.transaction_id if invoice.transaction_id else ''}<br/>"
            "2. This is a computer-generated invoice and requires no physical signature.<br/>"
            f"3. For billing disputes, please contact {hospital.legal_name} Billing Desk.<br/>"
            "4. Thank you for choosing us for your healthcare needs."
        )
        story.append(Paragraph(guidelines_text, normal_style))
        story.append(Spacer(1, 30))

        # 6. Common Seal
        seal_data = [
            [
                Paragraph(hospital.billing_footer or "", normal_style),
                Paragraph("<b>Authorized Signatory</b><br/><br/><br/>___________________", ParagraphStyle('RightText', parent=normal_style, alignment=2))
            ]
        ]
        seal_table = Table(seal_data, colWidths=[300, 220])
        seal_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(seal_table)

        doc.build(story)
        invoice.pdf_path = file_path # type: ignore
        db.commit()

        return file_path

    @staticmethod
    def send_email_notification(db: Session, invoice_id: int) -> bool:
        """
        Sends the invoice email to the patient, attaching the generated PDF.
        """
        invoice = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == invoice_id).first()
        if not invoice or not invoice.patient.email_id:
            logger.warning(f"Failed to send invoice email: Invoice {invoice_id} not found or patient email empty.")
            return False

        patient_email = invoice.patient.email_id
        hospital_name = invoice.hospital.legal_name
        invoice_number = invoice.invoice_number
        amount = invoice.total_amount

        # Verify PDF exists or generate
        pdf_path = str(invoice.pdf_path) if invoice.pdf_path else ""
        if not pdf_path or not os.path.exists(pdf_path):
            pdf_path = PatientBillingService.generate_pdf_file(invoice, db)

        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.mime.base import MIMEBase
        from email import encoders
        from app.core.config import settings

        try:
            msg = MIMEMultipart()
            msg['From'] = f"{hospital_name} Billing <{settings.SENDER_EMAIL}>"
            msg['To'] = patient_email
            msg['Subject'] = f"Invoice {invoice_number} from {hospital_name}"

            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
                <div style="max-width: 600px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #0f172a; color: white; padding: 25px; text-align: center;">
                        <h2 style="margin: 0;">{hospital_name}</h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Patient Invoice Statement</p>
                    </div>
                    <div style="padding: 25px;">
                        <p>Dear <b>{invoice.patient.full_name}</b>,</p>
                        <p>Please find attached your patient medical invoice for services rendered at our facility.</p>
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr>
                                    <td style="padding: 5px 0; color: #64748b;">Invoice Number:</td>
                                    <td style="padding: 5px 0; font-weight: bold; text-align: right;">{invoice_number}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #64748b;">Bill Date:</td>
                                    <td style="padding: 5px 0; text-align: right;">{invoice.bill_date.strftime('%d-%b-%Y')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #64748b;">Amount Due:</td>
                                    <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #0f172a; font-size: 16px;">₹ {amount:,.2f}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; color: #64748b;">Status:</td>
                                    <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #15803d;">{invoice.status}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p>For any inquiries regarding this bill, please reply to this email or contact our support desk.</p>
                        <p style="margin-top: 30px; font-size: 12px; color: #64748b;">This is a system generated notification. Please find the detailed PDF attached.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            msg.attach(MIMEText(body, 'html'))

            # Attach PDF
            if pdf_path and os.path.exists(pdf_path):
                with open(pdf_path, 'rb') as f:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename="{os.path.basename(pdf_path)}"'
                    )
                    msg.attach(part)

            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SENDER_EMAIL, patient_email, msg.as_string())
            server.quit()
            
            logger.info(f"Patient Invoice email sent successfully to {patient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {patient_email}: {str(e)}")
            return False

    @staticmethod
    def send_whatsapp_notification(db: Session, invoice_id: int) -> bool:
        """
        Sends a WhatsApp notification to the patient with a short link to their invoice PDF.
        """
        invoice = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == invoice_id).first()
        if not invoice or not invoice.patient.phone:
            logger.warning(f"Failed to send WhatsApp: Invoice {invoice_id} not found or patient phone empty.")
            return False

        patient_phone = invoice.patient.phone
        patient_name = invoice.patient.full_name
        hospital_name = invoice.hospital.legal_name
        invoice_number = invoice.invoice_number
        amount = invoice.total_amount
        pdf_download_url = f"https://digifortlabs.com/local_storage/patient_invoices/invoice_{invoice.invoice_number.replace('/', '_')}.pdf"

        # Log simulated WhatsApp send
        whatsapp_log_msg = (
            "\n" + "="*80 + "\n"
            f"[WHATSAPP SIMULATED SEND]\n"
            f"To: {patient_phone} ({patient_name})\n"
            f"From: {hospital_name}\n"
            f"Message: Hello {patient_name}, your medical invoice {invoice_number} for ₹{amount:,.2f} is ready. "
            f"You can view and download your invoice PDF here: {pdf_download_url}\n"
            + "="*80 + "\n"
        )
        logger.info(whatsapp_log_msg)
        print(whatsapp_log_msg)
        return True
