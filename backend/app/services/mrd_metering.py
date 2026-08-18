import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Hospital, Patient, PDFFile

logger = logging.getLogger(__name__)

def calculate_mrd_usage(db: Session, hospital_id: int) -> Dict[str, Any]:
    """
    Calculates detailed MRD usage and file overage bill for a specific hospital tenant.
    Formula: Total Bill = (File Count * Price Per File) + MAX(0, Extra Pages * Price Per Extra Page)
    """
    hospital = db.query(Hospital).filter(
        Hospital.hospital_id == hospital_id,
        Hospital.is_deleted == False
    ).first()

    if not hospital:
        raise ValueError(f"Hospital with ID {hospital_id} not found.")

    # Base pricing defaults
    price_per_file = hospital.price_per_file if hospital.price_per_file is not None else 100.0
    included_pages = hospital.included_pages if hospital.included_pages is not None else 20
    price_per_extra_page = hospital.price_per_extra_page if hospital.price_per_extra_page is not None else 1.0

    # Retrieve patient records and uploaded files
    patient_ids = [p[0] for p in db.query(Patient.record_id).filter(
        Patient.hospital_id == hospital_id,
        Patient.is_deleted == False
    ).all()]

    total_patient_files = len(patient_ids)

    files = db.query(PDFFile).filter(
        PDFFile.patient_record_id.in_(patient_ids),
        PDFFile.upload_status == 'confirmed'
    ).all() if patient_ids else []

    total_documents = len(files)
    total_pages = sum(f.page_count or 0 for f in files)

    # Compute page overages per document
    extra_pages_count = 0
    extra_pages_charge = 0.0

    for file in files:
        pages = file.page_count or 0
        if pages > included_pages:
            over = pages - included_pages
            extra_pages_count += over
            extra_pages_charge += (over * price_per_extra_page)

    base_file_charge = total_patient_files * price_per_file
    total_mrd_bill = base_file_charge + extra_pages_charge

    return {
        "hospital_id": hospital_id,
        "legal_name": hospital.legal_name,
        "subscription_tier": hospital.subscription_tier,
        "mrd_service_type": hospital.mrd_service_type,
        "pricing": {
            "price_per_file": price_per_file,
            "included_pages": included_pages,
            "price_per_extra_page": price_per_extra_page
        },
        "usage_metrics": {
            "total_patient_files": total_patient_files,
            "total_documents": total_documents,
            "total_pages": total_pages,
            "extra_pages_count": extra_pages_count
        },
        "billing_breakdown": {
            "base_file_charge": round(base_file_charge, 2),
            "extra_pages_charge": round(extra_pages_charge, 2),
            "total_mrd_bill": round(total_mrd_bill, 2)
        }
    }
