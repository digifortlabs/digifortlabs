from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from fastapi import File, UploadFile, Form
import os
from ..database import get_db
from ..models import User, LabTestCatalog, LabOrder, LabResult, Patient, DoctorProfile
from .auth import get_current_user

router = APIRouter(
    prefix="/lab",
    tags=["lab"]
)

class OrderRequest(BaseModel):
    patient_id: int
    test_ids: List[int]
    visit_type: Optional[str] = None
    visit_id: Optional[int] = None

class ResultRequest(BaseModel):
    order_id: int
    test_id: int
    result_value: str
    reference_range: Optional[str] = None
    remarks: Optional[str] = None

class LabTestCreate(BaseModel):
    test_name: str
    price: float = 0.0

@router.get("/catalog")
def get_catalog(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    # Auto-seed basic catalog if empty
    catalog = db.query(LabTestCatalog).filter(LabTestCatalog.hospital_id == target_hospital).all()
    if not catalog:
        default_tests = [
            ("Complete Blood Count (CBC)", 500.0),
            ("Lipid Profile", 800.0),
            ("Liver Function Test (LFT)", 900.0),
            ("Kidney Function Test (KFT)", 900.0),
            ("HbA1c", 400.0),
            ("Chest X-Ray", 600.0),
            ("Urine Routine", 200.0)
        ]
        for name, price in default_tests:
            t = LabTestCatalog(hospital_id=target_hospital, test_name=name, price=price)
            db.add(t)
        db.commit()
        catalog = db.query(LabTestCatalog).filter(LabTestCatalog.hospital_id == target_hospital).all()
        
    return catalog

@router.post("/catalog/seed-comprehensive")
def seed_comprehensive_catalog(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = current_user.hospital_id
    comprehensive_tests = [
        # CT Scans
        ("CT Head / Brain", 2500.0),
        ("HRCT Chest", 3500.0),
        ("CT Abdomen & Pelvis", 4500.0),
        ("CT KUB (Kidney, Ureter, Bladder)", 3000.0),
        ("CT PNS (Paranasal Sinuses)", 2500.0),
        ("CT Angiography", 6500.0),
        
        # MRI
        ("MRI Brain", 6000.0),
        ("MRI Cervical Spine", 5500.0),
        ("MRI Lumbar Spine", 5500.0),
        ("MRI Whole Abdomen", 8000.0),
        ("MRI Knee Joint", 6000.0),
        ("MRI Pelvis", 6500.0),
        
        # Sonography / Ultrasound
        ("USG Whole Abdomen", 1200.0),
        ("USG KUB (Kidneys, Ureters, Bladder)", 1000.0),
        ("USG Pelvis", 1000.0),
        ("USG Fetal Wellbeing", 1500.0),
        ("USG Pregnancy Routine", 1200.0),
        ("USG Thyroid", 1200.0),
        ("Echocardiography (Echo)", 1800.0),
        ("Doppler Scan", 2500.0),
        
        # Pathology / Lab Tests
        ("Complete Blood Count (CBC)", 450.0),
        ("C-Reactive Protein (CRP)", 500.0),
        ("Liver Function Test (LFT)", 800.0),
        ("Kidney Function Test (KFT)", 800.0),
        ("Lipid Profile", 700.0),
        ("Thyroid Profile (T3, T4, TSH)", 650.0),
        ("HbA1c", 450.0),
        ("Vitamin D3", 1200.0),
        ("Vitamin B12", 1000.0),
        ("Urine Routine & Microscopy", 200.0),
        ("Blood Culture", 800.0),
        ("Widal Test (Typhoid)", 300.0),
        ("Dengue NS1 Antigen", 600.0),
        ("Malaria Antigen", 400.0),
        ("Electrolytes (Na, K, Cl)", 450.0),
        ("Uric Acid", 250.0),
        ("Prothrombin Time (PT/INR)", 400.0)
    ]
    
    count = 0
    for name, price in comprehensive_tests:
        existing = db.query(LabTestCatalog).filter(
            LabTestCatalog.hospital_id == target_hospital,
            LabTestCatalog.test_name.ilike(name)
        ).first()
        if not existing:
            new_test = LabTestCatalog(
                hospital_id=target_hospital,
                test_name=name,
                price=price
            )
            db.add(new_test)
            count += 1
            
    db.commit()
    return {"message": f"Successfully added {count} new comprehensive tests to the catalog."}

@router.post("/catalog")
def add_catalog_item(
    payload: LabTestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = current_user.hospital_id
    
    existing = db.query(LabTestCatalog).filter(
        LabTestCatalog.hospital_id == target_hospital, 
        LabTestCatalog.test_name.ilike(payload.test_name)
    ).first()
    
    if existing:
        return existing
        
    new_test = LabTestCatalog(
        hospital_id=target_hospital,
        test_name=payload.test_name,
        price=payload.price
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    return new_test

@router.post("/orders")
def create_orders(
    payload: OrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models import IPDAdmission, PatientInvoice, PatientInvoiceItem
    
    # Determine doctor if applicable
    doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.user_id).first()
    
    created_orders = []
    total_ipd_charge = 0.0
    
    for t_id in payload.test_ids:
        test_info = db.query(LabTestCatalog).filter(LabTestCatalog.test_id == t_id).first()
        test_price = test_info.price if test_info else 0.0
        
        order = LabOrder(
            patient_id=payload.patient_id,
            hospital_id=current_user.hospital_id,
            doctor_id=doctor.profile_id if doctor else None,
            visit_type=payload.visit_type,
            visit_id=payload.visit_id,
            status="Pending"
        )
        db.add(order)
        db.flush() # get order.order_id
        
        # Link to result table (empty for now)
        res = LabResult(
            order_id=order.order_id,
            test_id=t_id,
            technician_id=current_user.user_id # Temporary placeholder until a tech claims it
        )
        db.add(res)
        created_orders.append(order)
        
        # Accumulate IPD charges
        if payload.visit_type == "IPD" and payload.visit_id:
            total_ipd_charge += test_price
            
            # Add line item immediately
            adm = db.query(IPDAdmission).filter(IPDAdmission.admission_id == payload.visit_id).first()
            if adm and adm.patient_invoice_id:
                invoice_item = PatientInvoiceItem(
                    invoice_id=adm.patient_invoice_id,
                    description=f"Lab Test: {test_info.test_name if test_info else 'Unknown'}",
                    qty=1,
                    unit_price=test_price,
                    amount=test_price,
                    charge_type="LAB_TEST",
                    reference_id=order.order_id
                )
                db.add(invoice_item)
                
    # Finalize IPD Invoice subtotal
    if payload.visit_type == "IPD" and payload.visit_id and total_ipd_charge > 0:
        adm = db.query(IPDAdmission).filter(IPDAdmission.admission_id == payload.visit_id).first()
        if adm and adm.patient_invoice_id:
            invoice = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == adm.patient_invoice_id).first()
            if invoice:
                invoice.subtotal = float(invoice.subtotal or 0) + total_ipd_charge
                invoice.total_amount = float(invoice.total_amount or 0) + total_ipd_charge

    db.commit()
    return {"message": f"Created {len(created_orders)} lab orders"}

@router.get("/orders/pending")
def get_pending_orders(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    orders = db.query(LabOrder, LabResult, LabTestCatalog, Patient)\
        .join(LabResult, LabOrder.order_id == LabResult.order_id)\
        .join(LabTestCatalog, LabResult.test_id == LabTestCatalog.test_id)\
        .join(Patient, LabOrder.patient_id == Patient.record_id)\
        .filter(LabOrder.hospital_id == target_hospital)\
        .filter(LabOrder.status.in_(["Pending", "Sample Collected"]))\
        .order_by(LabOrder.ordered_at.desc())\
        .all()
        
    result = []
    for order, res, test, pat in orders:
        result.append({
            "order_id": order.order_id,
            "patient_name": pat.full_name,
            "mrd_number": pat.patient_u_id,
            "test_name": test.test_name,
            "test_id": test.test_id,
            "status": order.status,
            "ordered_at": order.ordered_at
        })
    return result

@router.delete("/orders/{order_id}")
def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models import IPDAdmission, PatientInvoice, PatientInvoiceItem
    
    order = db.query(LabOrder).filter(LabOrder.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    invoice_item = db.query(PatientInvoiceItem).filter(
        PatientInvoiceItem.charge_type == "LAB_TEST",
        PatientInvoiceItem.reference_id == order.order_id
    ).first()
    
    if invoice_item:
        invoice = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == invoice_item.invoice_id).first()
        if invoice:
            invoice.subtotal = float(invoice.subtotal or 0) - float(invoice_item.amount or 0)
            invoice.total_amount = float(invoice.total_amount or 0) - float(invoice_item.amount or 0)
        db.delete(invoice_item)
        
    db.query(LabResult).filter(LabResult.order_id == order_id).delete()
    db.delete(order)
    db.commit()
    
    return {"message": "Order deleted successfully"}

@router.post("/results")
def enter_result(
    payload: ResultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.query(LabResult).filter(LabResult.order_id == payload.order_id, LabResult.test_id == payload.test_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Lab result record not found")
        
    result.result_value = payload.result_value
    result.reference_range = payload.reference_range
    result.remarks = payload.remarks
    result.technician_id = current_user.user_id
    result.completed_at = datetime.now()
    
    order = db.query(LabOrder).filter(LabOrder.order_id == payload.order_id).first()
    if order:
        order.status = "Completed"
        
    db.commit()
    return {"message": "Result saved successfully"}

@router.post("/results/upload")
def enter_result_with_upload(
    order_id: int = Form(...),
    test_id: int = Form(...),
    result_value: str = Form(...),
    reference_range: Optional[str] = Form(None),
    remarks: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..services.s3_handler import S3Manager
    
    result = db.query(LabResult).filter(LabResult.order_id == order_id, LabResult.test_id == test_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Lab result record not found")
        
    result.result_value = result_value
    result.reference_range = reference_range
    result.remarks = remarks
    result.technician_id = current_user.user_id
    result.completed_at = datetime.now()
    
    if file:
        s3_manager = S3Manager()
        h_name = current_user.hospital.legal_name if current_user.hospital else "default_hospital"
        clean_h_name = "".join(c if c.isalnum() else "_" for c in h_name).strip("_")
        
        object_name = f"{clean_h_name}/lab_reports/{order_id}_{test_id}_{file.filename}"
        success, url = s3_manager.upload_file(file.file, object_name, content_type=file.content_type)
        if success:
            result.report_file_url = url
            
    order = db.query(LabOrder).filter(LabOrder.order_id == order_id).first()
    if order:
        order.status = "Completed"
        
    db.commit()
    return {"message": "Result saved successfully"}

@router.delete("/results/{order_id}/{test_id}/report")
def delete_report(
    order_id: int,
    test_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = db.query(LabResult).filter(LabResult.order_id == order_id, LabResult.test_id == test_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Lab result record not found")
    
    # Normally we would also delete from S3 here, but for simplicity we just remove the URL
    result.report_file_url = None
    db.commit()
    return {"message": "Report deleted successfully"}
