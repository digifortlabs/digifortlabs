import sqlite3

def init_db():
    conn = sqlite3.connect('digifortlabs.db')
    cursor = conn.cursor()

    try:
        # Insurance Providers
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS insurance_providers (
            provider_id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id INTEGER NOT NULL,
            name VARCHAR NOT NULL,
            contact_email VARCHAR,
            contact_phone VARCHAR,
            portal_url VARCHAR,
            FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id)
        )
        ''')
        
        # Insurance Claims
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS insurance_claims (
            claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            policy_number VARCHAR NOT NULL,
            claim_amount FLOAT NOT NULL,
            approved_amount FLOAT,
            status VARCHAR DEFAULT 'pending',
            submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_date DATETIME,
            notes TEXT,
            FOREIGN KEY(patient_id) REFERENCES dental_patients(patient_id),
            FOREIGN KEY(provider_id) REFERENCES insurance_providers(provider_id)
        )
        ''')
        
        # Dental Labs
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS dental_labs (
            lab_id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id INTEGER NOT NULL,
            name VARCHAR NOT NULL,
            contact_person VARCHAR,
            phone VARCHAR,
            email VARCHAR,
            address TEXT,
            FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id)
        )
        ''')
        
        # Dental Lab Orders
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS dental_lab_orders (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            lab_id INTEGER NOT NULL,
            dentist_id INTEGER NOT NULL,
            appliance_type VARCHAR NOT NULL,
            tooth_number VARCHAR,
            shade VARCHAR,
            instructions TEXT,
            sent_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            due_date DATETIME,
            received_date DATETIME,
            status VARCHAR DEFAULT 'sent',
            FOREIGN KEY(patient_id) REFERENCES dental_patients(patient_id),
            FOREIGN KEY(lab_id) REFERENCES dental_labs(lab_id),
            FOREIGN KEY(dentist_id) REFERENCES users(user_id)
        )
        ''')

        # Ortho Records
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ortho_records (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            dentist_id INTEGER NOT NULL,
            visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            appliance_type VARCHAR NOT NULL,
            upper_wire VARCHAR,
            lower_wire VARCHAR,
            elastics VARCHAR,
            notes TEXT,
            next_visit_tasks TEXT,
            FOREIGN KEY(patient_id) REFERENCES dental_patients(patient_id),
            FOREIGN KEY(dentist_id) REFERENCES users(user_id)
        )
        ''')

        # Communication Logs
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS communication_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            comm_type VARCHAR NOT NULL,
            category VARCHAR NOT NULL,
            message_content TEXT NOT NULL,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR DEFAULT 'sent',
            FOREIGN KEY(patient_id) REFERENCES dental_patients(patient_id)
        )
        ''')

        # Inventory Items
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS dental_inventory_items (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id INTEGER NOT NULL,
            name VARCHAR NOT NULL,
            category VARCHAR DEFAULT 'Consumables',
            sku_code VARCHAR,
            current_stock INTEGER DEFAULT 0,
            reorder_point INTEGER DEFAULT 5,
            unit_of_measure VARCHAR DEFAULT 'boxes',
            expiry_date DATETIME,
            last_restocked DATETIME,
            FOREIGN KEY(hospital_id) REFERENCES hospitals(hospital_id)
        )
        ''')

        # Inventory Transactions
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS dental_inventory_transactions (
            txn_id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            change_type VARCHAR NOT NULL,
            quantity INTEGER NOT NULL,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(item_id) REFERENCES dental_inventory_items(item_id),
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
        ''')

        # Indices
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_insurance_providers_provider_id ON insurance_providers (provider_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_insurance_claims_claim_id ON insurance_claims (claim_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_dental_labs_lab_id ON dental_labs (lab_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_dental_lab_orders_order_id ON dental_lab_orders (order_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_ortho_records_record_id ON ortho_records (record_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_communication_logs_log_id ON communication_logs (log_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_dental_inventory_items_item_id ON dental_inventory_items (item_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_dental_inventory_items_name ON dental_inventory_items (name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_dental_inventory_transactions_txn_id ON dental_inventory_transactions (txn_id)")

        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    print("Final Dental feature tables created successfully.")
