
import os
import sys
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import ProgrammingError
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def get_col_type(column):
    # Construct ALTER TABLE command
    col_type = str(column.type).split('(')[0] # Basic type mapping
    if 'VARCHAR' in str(column.type):
        col_type = str(column.type)
    elif 'INTEGER' in str(column.type):
        col_type = 'INTEGER'
    elif 'BOOLEAN' in str(column.type):
        col_type = 'BOOLEAN'
    elif 'DATETIME' in str(column.type) or 'TIMESTAMP' in str(column.type):
        col_type = 'TIMESTAMP WITH TIME ZONE'
    elif 'FLOAT' in str(column.type):
        col_type = 'DOUBLE PRECISION'
    elif 'TEXT' in str(column.type):
        col_type = 'TEXT'
    return col_type

def migrate():
    inspector = inspect(engine)
    
    # 1. Handle Primary Key rename for Patients if needed
    if 'patients' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('patients')]
        if 'patient_id' in columns and 'record_id' not in columns:
            print("🔄 Renaming patients.patient_id to patients.record_id...")
            try:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE patients RENAME COLUMN patient_id TO record_id"))
                print("✅ Renamed successfully.")
            except Exception as e:
                print(f"❌ Failed to rename: {e}")

    # 2. Add Missing Columns for all tables
    from app.models import Base
    
    for table_name, table in Base.metadata.tables.items():
        if table_name not in inspector.get_table_names():
            print(f"🆕 Creating new table: {table_name}")
            try:
                table.create(engine)
                print(f"✅ Created table {table_name}")
            except Exception as e:
                print(f"❌ Failed to create table {table_name}: {e}")
            continue
            
        existing_columns = [c['name'] for c in inspector.get_columns(table_name)]
        
        for column in table.columns:
            if column.name in existing_columns:
                continue
                
            print(f"➕ Adding column {column.name} to {table_name}...")
            
            col_type = get_col_type(column)
            
            # For columns like 'id' being added to existing tables, they MUST be nullable or have a default
            # if the table already has data. 
            nullable_sql = "NULL"
            if not column.nullable and table_name in inspector.get_table_names():
                # If it's NOT NULL in models, we still add as NULL first if it's an existing table
                # to avoid "column contains null values" error, then we'd have to fill it.
                # But for our sync, making it NULL is safer for now.
                nullable_sql = "NULL" 

            default_sql = ""
            if column.server_default is not None:
                if 'now' in str(column.server_default.arg).lower():
                    default_sql = " DEFAULT CURRENT_TIMESTAMP"
            
            # Special case for SERIAL/Primary keys if they are missing
            if column.primary_key and 'int' in col_type.lower():
                # We skip adding 'id' columns to existing tables if they are meant to be auto-increment
                # because adding a SERIAL to an existing table is complex.
                # However, many of these are likely from new tables that failed to create.
                pass

            try:
                sql = text(f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type} {nullable_sql} {default_sql}")
                with engine.begin() as conn:
                    conn.execute(sql)
                print(f"✅ Success: {table_name}.{column.name} added.")
            except ProgrammingError as e:
                if "already exists" in str(e):
                    print(f"ℹ️ Column {column.name} already exists in {table_name}.")
                else:
                    print(f"❌ SQL Error for {column.name}: {e}")
            except Exception as e:
                print(f"❌ Failed to add {column.name} to {table_name}: {e}")

    print("\n🏁 Migration complete!")

if __name__ == "__main__":
    migrate()
