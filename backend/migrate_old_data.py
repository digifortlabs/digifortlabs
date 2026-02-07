import sys
import os
import re
from sqlalchemy import create_engine, MetaData, Table, select, insert, delete, text

# RDS Source URL
RDS_URL = "postgresql://postgres:Digif0rtlab$@digifort-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com:5432/postgres"

# Local Target URL
LOCAL_URL = "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db"

def clean_age(age_val):
    if age_val is None:
        return None
    if isinstance(age_val, int):
        return age_val
    match = re.search(r'\d+', str(age_val))
    if match:
        return int(match.group())
    return None

def migrate():
    source_engine = create_engine(RDS_URL)
    target_engine = create_engine(LOCAL_URL)
    
    metadata_source = MetaData()
    metadata_source.reflect(bind=source_engine)
    
    metadata_target = MetaData()
    metadata_target.reflect(bind=target_engine)
    
    # Order matters for foreign keys
    tables_to_migrate = [
        "hospitals",
        "warehouses",
        "physical_racks",
        "physical_boxes",
        "users",
        "patients",
        "pdf_files",
        "ai_extractions",
        "audit_logs",
        "system_settings",
        "accounting_config",
        "accounting_vendors",
        "accounting_expenses",
        "accounting_transactions",
        "available_invoice_numbers",
        "bandwidth_usage",
        "file_requests",
        "icd11_codes",
        "icd11_procedure_codes",
        "inventory_items",
        "inventory_logs",
        "invoices",
        "invoice_items",
        "password_reset_otps",
        "patient_diagnoses",
        "patient_procedures",
        "physical_movement_logs",
        "qa_entries",
        "qa_issues"
    ]
    
    # Get first hospital ID for fallbacks
    first_hospital_id = 1
    with source_engine.connect() as conn:
        res = conn.execute(text("SELECT hospital_id FROM hospitals LIMIT 1")).scalar()
        if res:
            first_hospital_id = res

    # 1. DELETE in REVERSE order
    with target_engine.connect() as target_conn:
        for table_name in reversed(tables_to_migrate):
            if table_name in metadata_target.tables:
                target_conn.execute(delete(metadata_target.tables[table_name]))
                target_conn.commit()

    # 2. INSERT in FORWARD order
    with source_engine.connect() as source_conn, target_engine.connect() as target_conn:
        for table_name in tables_to_migrate:
            if table_name not in metadata_source.tables or table_name not in metadata_target.tables:
                continue
                
            print(f"📥 Inserting data into: {table_name}")
            source_table = metadata_source.tables[table_name]
            target_table = metadata_target.tables[table_name]
            
            # Fetch data
            result = source_conn.execute(select(source_table))
            
            # Use chunks for large tables
            chunk_size = 1000
            while True:
                rows = result.fetchmany(chunk_size)
                if not rows:
                    break
                
                target_columns = set(target_table.columns.keys())
                data = []
                for row in rows:
                    row_dict = dict(row._mapping)
                    filtered_dict = {k: v for k, v in row_dict.items() if k in target_columns}
                    
                    # --- Data Cleaning ---
                    
                    # 1. Users Safety
                    if table_name == "users":
                        if not filtered_dict.get("full_name"):
                            filtered_dict["full_name"] = "Legacy User"
                    
                    # 2. Patients Safety
                    if table_name == "patients":
                        if "age" in filtered_dict:
                            filtered_dict["age"] = clean_age(filtered_dict["age"])
                        if not filtered_dict.get("patient_u_id"):
                            filtered_dict["patient_u_id"] = f"LEGACY-{filtered_dict.get('record_id')}"
                    
                    # 3. PDF Files Safety
                    if table_name == "pdf_files":
                        if not filtered_dict.get("file_path"):
                            fallback = filtered_dict.get("s3_key") or filtered_dict.get("storage_path") or "missing_path"
                            filtered_dict["file_path"] = fallback
                        if not filtered_dict.get("filename"):
                            filtered_dict["filename"] = "unnamed.pdf"
                    
                    # 4. Mandatory Hospital ID fallbacks
                    mandatory_hosp_tables = ["patients", "physical_boxes", "file_requests", "qa_issues", "invoices", "bandwidth_usage", "qa_issues"]
                    if table_name in mandatory_hosp_tables:
                        if filtered_dict.get("hospital_id") is None:
                            filtered_dict["hospital_id"] = first_hospital_id
                            
                    # --- End Data Cleaning ---
                    
                    data.append(filtered_dict)
                
                if data:
                    target_conn.execute(insert(target_table), data)
                    target_conn.commit()
            
            print(f"✅ Completed insert for {table_name}")
            
    # Reset sequences (Postgres specific)
    print("🔄 Resetting sequences...")
    with target_engine.connect() as conn:
        for table_name in tables_to_migrate:
            if table_name not in metadata_target.tables:
                continue
            # Check for serial columns
            res = conn.execute(text(f"""
                SELECT column_name, column_default 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' AND column_default LIKE 'nextval%';
            """))
            for col, default in res:
                try:
                    seq_name = default.split("'")[1]
                    conn.execute(text(f"SELECT setval('{seq_name}', coalesce(max({col}), 1), max({col}) IS NOT NULL) FROM \"{table_name}\""))
                except:
                    print(f"⚠️ Failed to reset sequence for {table_name}.{col}")
        conn.commit()
    print("✨ Migration Complete!")

if __name__ == "__main__":
    migrate()
