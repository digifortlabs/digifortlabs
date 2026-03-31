"""
Database Migration Script for New Modules
Creates tables for: Clinic OPD, Pharma, Legal, Corporate, HMS

Run this script to create all required tables for the new modules.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./digifortlabs.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def run_migrations():
    print("🔧 Starting database migrations for new modules...")
    
    with engine.connect() as conn:
        try:
            # ===== CLINIC OPD MODULE =====
            print("📋 Creating Clinic OPD tables...")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS opd_patients (
                    opd_patient_id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES patients(record_id) NOT NULL,
                    hospital_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    blood_group VARCHAR,
                    allergies TEXT,
                    chronic_conditions JSON DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS opd_visits (
                    visit_id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES patients(record_id) NOT NULL,
                    hospital_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    doctor_id INTEGER REFERENCES users(user_id),
                    visit_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    temperature FLOAT,
                    blood_pressure VARCHAR,
                    pulse_rate INTEGER,
                    weight FLOAT,
                    chief_complaint TEXT,
                    diagnosis TEXT,
                    treatment TEXT,
                    consultation_fee FLOAT DEFAULT 0.0,
                    is_paid BOOLEAN DEFAULT FALSE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS prescriptions (
                    prescription_id SERIAL PRIMARY KEY,
                    visit_id INTEGER REFERENCES opd_visits(visit_id) NOT NULL,
                    medicine_name VARCHAR NOT NULL,
                    dosage VARCHAR NOT NULL,
                    frequency VARCHAR NOT NULL,
                    duration VARCHAR NOT NULL,
                    instructions TEXT
                )
            """))
            
            # ===== PHARMA MODULE =====
            print("💊 Creating Pharma tables...")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS pharma_medicines (
                    medicine_id SERIAL PRIMARY KEY,
                    hospital_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    medicine_name VARCHAR NOT NULL,
                    generic_name VARCHAR,
                    brand_name VARCHAR,
                    manufacturer VARCHAR,
                    category VARCHAR,
                    drug_class VARCHAR,
                    schedule VARCHAR,
                    form VARCHAR,
                    strength VARCHAR,
                    pack_size INTEGER DEFAULT 1,
                    mrp FLOAT NOT NULL,
                    purchase_price FLOAT NOT NULL,
                    selling_price FLOAT NOT NULL,
                    gst_rate FLOAT DEFAULT 12.0,
                    current_stock INTEGER DEFAULT 0,
                    reorder_level INTEGER DEFAULT 10,
                    requires_prescription BOOLEAN DEFAULT TRUE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS pharma_stock (
                    stock_id SERIAL PRIMARY KEY,
                    medicine_id INTEGER REFERENCES pharma_medicines(medicine_id) NOT NULL,
                    batch_number VARCHAR NOT NULL,
                    manufacturing_date TIMESTAMP,
                    expiry_date TIMESTAMP NOT NULL,
                    quantity_received INTEGER NOT NULL,
                    quantity_remaining INTEGER NOT NULL,
                    supplier_name VARCHAR,
                    supplier_invoice VARCHAR,
                    purchase_date TIMESTAMP,
                    purchase_price_per_unit FLOAT NOT NULL,
                    selling_price_per_unit FLOAT NOT NULL
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS pharma_sales (
                    sale_id SERIAL PRIMARY KEY,
                    hospital_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    customer_name VARCHAR,
                    customer_phone VARCHAR,
                    prescription_number VARCHAR,
                    doctor_name VARCHAR,
                    subtotal FLOAT NOT NULL,
                    discount FLOAT DEFAULT 0.0,
                    gst_amount FLOAT NOT NULL,
                    total_amount FLOAT NOT NULL,
                    payment_method VARCHAR DEFAULT 'cash',
                    payment_status VARCHAR DEFAULT 'paid'
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS pharma_sale_items (
                    item_id SERIAL PRIMARY KEY,
                    sale_id INTEGER REFERENCES pharma_sales(sale_id) NOT NULL,
                    medicine_id INTEGER REFERENCES pharma_medicines(medicine_id) NOT NULL,
                    stock_id INTEGER REFERENCES pharma_stock(stock_id) NOT NULL,
                    quantity INTEGER NOT NULL,
                    unit_price FLOAT NOT NULL,
                    discount FLOAT DEFAULT 0.0,
                    gst_rate FLOAT NOT NULL,
                    total_price FLOAT NOT NULL
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS pharma_expiry_alerts (
                    alert_id SERIAL PRIMARY KEY,
                    stock_id INTEGER REFERENCES pharma_stock(stock_id) NOT NULL,
                    medicine_id INTEGER REFERENCES pharma_medicines(medicine_id) NOT NULL,
                    expiry_date TIMESTAMP NOT NULL,
                    days_to_expiry INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    alert_status VARCHAR DEFAULT 'pending'
                )
            """))
            
            # ===== LEGAL MODULE =====
            print("⚖️ Creating Legal tables...")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS legal_clients (
                    client_id SERIAL PRIMARY KEY,
                    firm_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    client_number VARCHAR UNIQUE NOT NULL,
                    client_type VARCHAR NOT NULL,
                    full_name VARCHAR NOT NULL,
                    company_name VARCHAR,
                    phone VARCHAR,
                    email VARCHAR,
                    address TEXT,
                    pan_number VARCHAR,
                    gst_number VARCHAR,
                    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS legal_cases (
                    case_id SERIAL PRIMARY KEY,
                    client_id INTEGER REFERENCES legal_clients(client_id) NOT NULL,
                    firm_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    case_number VARCHAR UNIQUE NOT NULL,
                    case_title VARCHAR NOT NULL,
                    case_type VARCHAR NOT NULL,
                    court_name VARCHAR,
                    court_location VARCHAR,
                    judge_name VARCHAR,
                    petitioner VARCHAR,
                    respondent VARCHAR,
                    filing_date TIMESTAMP,
                    status VARCHAR DEFAULT 'Filed',
                    priority VARCHAR DEFAULT 'medium',
                    primary_lawyer_id INTEGER REFERENCES users(user_id),
                    team_members JSON DEFAULT '[]',
                    case_summary TEXT,
                    legal_issues TEXT
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS case_hearings (
                    hearing_id SERIAL PRIMARY KEY,
                    case_id INTEGER REFERENCES legal_cases(case_id) NOT NULL,
                    hearing_date TIMESTAMP NOT NULL,
                    hearing_type VARCHAR NOT NULL,
                    court_room VARCHAR,
                    judge_name VARCHAR,
                    outcome TEXT,
                    next_hearing_date TIMESTAMP,
                    lawyer_attended BOOLEAN DEFAULT FALSE,
                    client_attended BOOLEAN DEFAULT FALSE,
                    notes TEXT
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS case_documents (
                    document_id SERIAL PRIMARY KEY,
                    case_id INTEGER REFERENCES legal_cases(case_id) NOT NULL,
                    document_type VARCHAR NOT NULL,
                    document_name VARCHAR NOT NULL,
                    file_path VARCHAR NOT NULL,
                    uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    uploaded_by INTEGER REFERENCES users(user_id),
                    is_confidential BOOLEAN DEFAULT FALSE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS legal_billing (
                    bill_id SERIAL PRIMARY KEY,
                    case_id INTEGER REFERENCES legal_cases(case_id) NOT NULL,
                    client_id INTEGER REFERENCES legal_clients(client_id) NOT NULL,
                    bill_date TIMESTAMP NOT NULL,
                    consultation_fee FLOAT DEFAULT 0.0,
                    court_fee FLOAT DEFAULT 0.0,
                    documentation_fee FLOAT DEFAULT 0.0,
                    other_charges FLOAT DEFAULT 0.0,
                    subtotal FLOAT NOT NULL,
                    gst_amount FLOAT NOT NULL,
                    total_amount FLOAT NOT NULL,
                    paid_amount FLOAT DEFAULT 0.0,
                    balance FLOAT NOT NULL,
                    payment_status VARCHAR DEFAULT 'pending'
                )
            """))
            
            # ===== CORPORATE MODULE =====
            print("🏢 Creating Corporate tables...")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS corporate_employees (
                    employee_id SERIAL PRIMARY KEY,
                    company_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    employee_code VARCHAR UNIQUE NOT NULL,
                    full_name VARCHAR NOT NULL,
                    dob TIMESTAMP,
                    gender VARCHAR,
                    phone VARCHAR,
                    email VARCHAR,
                    address TEXT,
                    designation VARCHAR,
                    department VARCHAR,
                    joining_date TIMESTAMP,
                    employment_type VARCHAR DEFAULT 'Permanent',
                    basic_salary FLOAT,
                    allowances JSON DEFAULT '{}',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS employee_documents (
                    document_id SERIAL PRIMARY KEY,
                    employee_id INTEGER REFERENCES corporate_employees(employee_id) NOT NULL,
                    document_type VARCHAR NOT NULL,
                    document_name VARCHAR NOT NULL,
                    file_path VARCHAR NOT NULL,
                    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS attendance (
                    attendance_id SERIAL PRIMARY KEY,
                    employee_id INTEGER REFERENCES corporate_employees(employee_id) NOT NULL,
                    date TIMESTAMP NOT NULL,
                    check_in TIMESTAMP,
                    check_out TIMESTAMP,
                    status VARCHAR DEFAULT 'Present',
                    work_hours FLOAT DEFAULT 0.0
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS corporate_projects (
                    project_id SERIAL PRIMARY KEY,
                    company_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    project_name VARCHAR NOT NULL,
                    project_code VARCHAR UNIQUE NOT NULL,
                    description TEXT,
                    start_date TIMESTAMP,
                    end_date TIMESTAMP,
                    status VARCHAR DEFAULT 'Planning',
                    budget FLOAT,
                    spent FLOAT DEFAULT 0.0,
                    team_members JSON DEFAULT '[]'
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS project_tasks (
                    task_id SERIAL PRIMARY KEY,
                    project_id INTEGER REFERENCES corporate_projects(project_id) NOT NULL,
                    task_name VARCHAR NOT NULL,
                    description TEXT,
                    assigned_to INTEGER REFERENCES corporate_employees(employee_id),
                    priority VARCHAR DEFAULT 'medium',
                    status VARCHAR DEFAULT 'todo',
                    due_date TIMESTAMP,
                    completed_date TIMESTAMP
                )
            """))
            
            # ===== HMS MODULE =====
            print("🏥 Creating HMS tables...")
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS wards (
                    ward_id SERIAL PRIMARY KEY,
                    hospital_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    ward_name VARCHAR NOT NULL,
                    ward_type VARCHAR NOT NULL,
                    total_beds INTEGER NOT NULL,
                    occupied_beds INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS beds (
                    bed_id SERIAL PRIMARY KEY,
                    ward_id INTEGER REFERENCES wards(ward_id) NOT NULL,
                    bed_number VARCHAR NOT NULL,
                    is_occupied BOOLEAN DEFAULT FALSE
                )
            """))
            
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ipd_admissions (
                    admission_id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES patients(record_id) NOT NULL,
                    hospital_id INTEGER REFERENCES hospitals(hospital_id) NOT NULL,
                    admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    discharge_date TIMESTAMP WITH TIME ZONE,
                    ward_id INTEGER REFERENCES wards(ward_id) NOT NULL,
                    bed_id INTEGER REFERENCES beds(bed_id) NOT NULL,
                    admitting_doctor_id INTEGER REFERENCES users(user_id),
                    diagnosis TEXT,
                    treatment_plan TEXT,
                    status VARCHAR DEFAULT 'admitted'
                )
            """))
            
            # Create indexes for better performance
            print("📊 Creating indexes...")
            
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_opd_patients_hospital ON opd_patients(hospital_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_opd_visits_patient ON opd_visits(patient_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_pharma_medicines_hospital ON pharma_medicines(hospital_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_pharma_medicines_name ON pharma_medicines(medicine_name)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_legal_clients_firm ON legal_clients(firm_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_legal_cases_client ON legal_cases(client_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_corporate_employees_company ON corporate_employees(company_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_wards_hospital ON wards(hospital_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ipd_admissions_hospital ON ipd_admissions(hospital_id)"))
            
            conn.commit()
            print("✅ All migrations completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("=" * 60)
    print("DIGIFORT LABS - Database Migration")
    print("Creating tables for new modules")
    print("=" * 60)
    
    run_migrations()
    
    print("\n" + "=" * 60)
    print("Migration Complete!")
    print("=" * 60)
    print("\nNew modules available:")
    print("  ✅ Clinic OPD")
    print("  ✅ Pharma Medical")
    print("  ✅ Law Firm")
    print("  ✅ Corporate")
    print("  ✅ HMS (Hospital Management System)")
    print("\nYou can now start using these modules via the API.")
