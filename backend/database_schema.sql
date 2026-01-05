-- Digifort Labs - Hospital Database Schema

-- 1. Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    hospital_id SERIAL PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'Standard',
    last_sync_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patient Records
CREATE TABLE IF NOT EXISTS patients (
    record_id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(hospital_id),
    patient_u_id VARCHAR(100) NOT NULL UNIQUE, -- Unique Health ID
    full_name VARCHAR(255),
    dob DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PDF Files
CREATE TABLE IF NOT EXISTS pdf_files (
    file_id SERIAL PRIMARY KEY,
    record_id INTEGER REFERENCES patients(record_id),
    s3_key VARCHAR(500) NOT NULL,
    file_size_mb FLOAT,
    encryption_status BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Temporary Access Cache (Logic for 15-30 day cleanup)
CREATE TABLE IF NOT EXISTS temp_access_cache (
    access_id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES pdf_files(file_id),
    local_path VARCHAR(500),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_timestamp TIMESTAMP NOT NULL
);

-- 5. Bandwidth Usage Tracker
CREATE TABLE IF NOT EXISTS bandwidth_usage (
    usage_id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(hospital_id),
    month_year VARCHAR(7), -- Format: "2024-01"
    used_mb FLOAT DEFAULT 0.0,
    quota_limit_mb FLOAT DEFAULT 1000.0, -- 1GB Limit
    UNIQUE(hospital_id, month_year)
);
