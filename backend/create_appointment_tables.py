import sqlite3
import datetime

def init_appointment_db():
    conn = sqlite3.connect('digifortlabs.db')
    cursor = conn.cursor()

    try:
        # 1. Create Departments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            department_id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id INTEGER NOT NULL,
            name VARCHAR NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id)
        )
        ''')

        # Insert default Dental department if not exists
        cursor.execute("SELECT department_id FROM departments WHERE name = 'Dental Clinic' LIMIT 1")
        row = cursor.fetchone()
        if not row:
            # Try to get a valid hospital ID
            cursor.execute("SELECT hospital_id FROM hospitals LIMIT 1")
            h_row = cursor.fetchone()
            if h_row:
                hospital_id = h_row[0]
                cursor.execute("INSERT INTO departments (hospital_id, name, description) VALUES (?, ?, ?)", 
                              (hospital_id, 'Dental Clinic', 'Centralized Dental Outpatient Department'))
                department_id = cursor.lastrowid
            else:
                department_id = None
        else:
            department_id = row[0]

        # 2. Create Profile and Schedules
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctor_profiles (
            profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            department_id INTEGER NOT NULL,
            specialization VARCHAR,
            consultation_fee FLOAT DEFAULT 0.0,
            FOREIGN KEY(user_id) REFERENCES users(user_id),
            FOREIGN KEY(department_id) REFERENCES departments(department_id)
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctor_schedules (
            schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
            doctor_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            start_time VARCHAR NOT NULL,
            end_time VARCHAR NOT NULL,
            slot_duration_minutes INTEGER DEFAULT 30,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY(doctor_id) REFERENCES users(user_id)
        )
        ''')

        # 3. Create unified Appointments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id INTEGER NOT NULL,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            department_id INTEGER NOT NULL,
            appointment_date DATETIME NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            status VARCHAR DEFAULT 'Scheduled',
            reason_for_visit VARCHAR,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id),
            FOREIGN KEY(patient_id) REFERENCES patients(record_id),
            FOREIGN KEY(doctor_id) REFERENCES users(user_id),
            FOREIGN KEY(department_id) REFERENCES departments(department_id)
        )
        ''')

        # 4. Migrate existing DentalAppointments
        # To do so, we need to read from dental_appointments
        try:
            cursor.execute("SELECT appointment_id, patient_id, start_time, end_time, status, purpose, notes FROM dental_appointments")
            existing_appts = cursor.fetchall()
            
            for appt in existing_appts:
                # Find the main patient record tied to this dental patient
                cursor.execute("SELECT main_patient_id, hospital_id FROM dental_patients WHERE patient_id = ?", (appt[1],))
                dp_row = cursor.fetchone()
                
                # We need a fallback if there's no main_patient_id, but assuming it exists
                if dp_row and dp_row[0] and department_id:
                    main_patient_id = dp_row[0]
                    hospital_id = dp_row[1]
                    
                    # Try to find a doctor user (just pick first doctor for default fallback)
                    cursor.execute("SELECT user_id FROM users WHERE role = 'doctor' OR role = 'hospital_admin' LIMIT 1")
                    d_row = cursor.fetchone()
                    doctor_id = d_row[0] if d_row else 1 # Fallback to 1
                    
                    # Insert into newly formed table if it doesn't already exist from a previous run
                    cursor.execute("""
                        INSERT INTO appointments 
                        (hospital_id, patient_id, doctor_id, department_id, appointment_date, start_time, end_time, status, reason_for_visit, notes) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (hospital_id, main_patient_id, doctor_id, department_id, appt[2], appt[2], appt[3], appt[4], appt[5], appt[6]))
            
            print(f"Migrated {len(existing_appts)} dental appointments.")
        except sqlite3.OperationalError:
            # Table might not exist or already dropped
            pass
            
        # Optional: You can drop table but let's keep it just in case, or drop it
        try:
            cursor.execute("DROP TABLE dental_appointments")
            print("Dropped legacy dental_appointments table.")
        except sqlite3.OperationalError:
            pass

        # Check for indices
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_appointments_patient_id ON appointments (patient_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_appointments_doctor_id ON appointments (doctor_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_appointments_department_id ON appointments (department_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_appointments_appointment_date ON appointments (appointment_date)")

        conn.commit()
        print("Centralized Appointment tables initialized successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    init_appointment_db()
