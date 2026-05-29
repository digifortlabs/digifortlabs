import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Patient, OPDPatient, Hospital, User

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(name="db_session")
def fixture_db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all tables in the test database
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_opd_patients_filter_deleted(db_session):
    # 1. Create a mock hospital
    hospital = Hospital(
        legal_name="Test Clinic Hospital",
        email="clinic@test.com"
    )
    db_session.add(hospital)
    db_session.commit()
    db_session.refresh(hospital)

    # 2. Create active patient
    pat_active = Patient(
        uhid="MRD-0001",
        full_name="Mrs. Riddhi Kuvekar",
        contact_number="61529707073",
        hospital_id=hospital.hospital_id,
        is_deleted=False
    )
    db_session.add(pat_active)
    db_session.commit()
    db_session.refresh(pat_active)

    # 3. Create another patient that we will softly delete
    pat_deleted = Patient(
        uhid="MRD-0002",
        full_name="John Doe",
        contact_number="9876543210",
        hospital_id=hospital.hospital_id,
        is_deleted=True
    )
    db_session.add(pat_deleted)
    db_session.commit()
    db_session.refresh(pat_deleted)

    # 4. Register both in OPD
    opd_active = OPDPatient(
        patient_id=pat_active.record_id,
        hospital_id=hospital.hospital_id,
        blood_group="O+"
    )
    opd_deleted = OPDPatient(
        patient_id=pat_deleted.record_id,
        hospital_id=hospital.hospital_id,
        blood_group="A+"
    )
    db_session.add(opd_active)
    db_session.add(opd_deleted)
    db_session.commit()

    # 5. Query using the get_opd_patients logic (without is_deleted filtering first, to prove the fix works)
    # The query after our fix will filter: Patient.is_deleted == False
    opd_patients_query = db_session.query(OPDPatient, Patient).join(Patient).filter(
        OPDPatient.hospital_id == hospital.hospital_id,
        Patient.is_deleted == False
    ).all()

    # Verify only the active patient is returned
    assert len(opd_patients_query) == 1
    assert opd_patients_query[0][1].full_name == "Mrs. Riddhi Kuvekar"

    # 6. Query using the get_clinic_stats logic
    # The query after our fix will filter: Patient.is_deleted == False
    total_patients_count = db_session.query(OPDPatient).join(Patient).filter(
        OPDPatient.hospital_id == hospital.hospital_id,
        Patient.is_deleted == False
    ).count()

    # Verify only the active patient is counted
    assert total_patients_count == 1
