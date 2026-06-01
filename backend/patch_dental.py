import re

with open('app/routers/dental.py', 'r', encoding='utf-8') as f:
    content = f.read()

helper = """
def get_or_create_dental_patient(patient_id: int, db: Session):
    patient = db.query(DentalPatient).filter((DentalPatient.patient_id == patient_id) | (DentalPatient.main_patient_id == patient_id)).first()
    if not patient:
        main_patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
        if main_patient:
            patient = DentalPatient(
                full_name=main_patient.full_name,
                phone=main_patient.phone_number,
                gender=main_patient.gender,
                date_of_birth=main_patient.date_of_birth,
                address=main_patient.address,
                hospital_id=main_patient.hospital_id,
                main_patient_id=main_patient.record_id
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        else:
            raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Patients
"""

content = content.replace('# Patients', helper)

pattern1 = r'patient\s*=\s*db\.query\(DentalPatient\)\.filter\(\(DentalPatient\.patient_id == patient_id\) \| \(DentalPatient\.main_patient_id == patient_id\)\)\.first\(\)\s*if not patient:\s*raise HTTPException\(status_code=404, detail="Patient not found"\)'
content = re.sub(pattern1, 'patient = get_or_create_dental_patient(patient_id, db)', content)

pattern2 = r'patient\s*=\s*db\.query\(DentalPatient\)\.filter\(DentalPatient\.patient_id == patient_id\)\.first\(\)\s*if not patient:\s*raise HTTPException\(status_code=404, detail="Patient not found"\)'
content = re.sub(pattern2, 'patient = get_or_create_dental_patient(patient_id, db)', content)

pattern3 = r'patient = db\.query\(DentalPatient\)\.filter\(DentalPatient\.patient_id == (.*?)\.patient_id\)\.first\(\)\s*if not patient:\s*raise HTTPException\(status_code=404, detail="Patient not found"\)'
content = re.sub(pattern3, r'patient = get_or_create_dental_patient(\1.patient_id, db)', content)

with open('app/routers/dental.py', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced')
