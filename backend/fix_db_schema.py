from sqlalchemy import text, create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./digifortlabs.db"

print(f"🔄 Repairing Database Schema: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("🛠️ Checking for missing columns...")
        
        # 1. PDF Files table updates
        if "postgresql" in DATABASE_URL:
            cols = [
                ("price_per_file", "FLOAT", "100.0"),
                ("included_pages", "INTEGER", "20"),
                ("price_per_extra_page", "FLOAT", "1.0"),
                ("page_count", "INTEGER", "0")
            ]
            for col, col_type, default in cols:
                try:
                    conn.execute(text(f"ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS {col} {col_type} DEFAULT {default}"))
                    print(f"✅ Verified pdf_files.{col}")
                except Exception as e:
                    print(f"⚠️ Warning adding pdf_files.{col}: {e}")
            
            # 2. ICD11 Codes tables updates
            for table in ["icd11_codes", "icd11_procedure_codes"]:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS chapter VARCHAR"))
                    print(f"✅ Verified {table}.chapter")
                except Exception as e:
                    print(f"⚠️ Warning adding {table}.chapter: {e}")
            
            # 3. QA Issues table updates
            try:
                conn.execute(text("ALTER TABLE qa_issues ADD COLUMN IF NOT EXISTS hospital_id INTEGER"))
                print("✅ Verified qa_issues.hospital_id")
            except Exception as e:
                print(f"⚠️ Warning adding qa_issues.hospital_id: {e}")
                
            conn.commit()
        else:
            # SQLite fallback
            tables_cols = {
                "pdf_files": [
                    ("price_per_file", "FLOAT", "100.0"),
                    ("included_pages", "INTEGER", "20"),
                    ("price_per_extra_page", "FLOAT", "1.0"),
                    ("page_count", "INTEGER", "0")
                ],
                "icd11_codes": [
                    ("chapter", "VARCHAR", "NULL")
                ],
                "icd11_procedure_codes": [
                    ("chapter", "VARCHAR", "NULL")
                ],
                "qa_issues": [
                    ("hospital_id", "INTEGER", "NULL")
                ]
            }
            for table, cols in tables_cols.items():
                for col, col_type, default in cols:
                    try:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type} DEFAULT {default}"))
                        print(f"✅ Added {table}.{col}")
                    except:
                        # SQLite doesn't have IF NOT EXISTS for ADD COLUMN, so we ignore errors if exists
                        pass
            conn.commit()

if __name__ == "__main__":
    run_migration()
    print("✨ Schema repair complete.")
