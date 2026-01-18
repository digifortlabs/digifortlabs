import os
import psycopg2
from datetime import datetime, date

def get_database_url():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    return line.strip().split("=", 1)[1].strip('"').strip("'")
    return os.getenv("DATABASE_URL")

def calculate_age_string(dob):
    if not dob:
        return None
    
    today = date.today()
    
    # Postgres returns date object directly
    if isinstance(dob, datetime):
        dob = dob.date()
        
    years = today.year - dob.year
    months = today.month - dob.month
    days = today.day - dob.day

    if months < 0 or (months == 0 and days < 0):
        years -= 1
        months += 12
    
    if days < 0:
        months -= 1
        if months < 0:
            months += 12
            years -= 1

    if years >= 1:
        return f"{years} Years"
    else:
        final_months = max(0, months)
        if final_months == 0 and years == 0:
            final_months = 1 
        return f"{final_months} Months"

def repair_rds():
    print("--- Starting RDS Repair ---")
    db_url = get_database_url()
    
    if not db_url or "postgres" not in db_url:
        print("Error: Could not find valid PostgreSQL DATABASE_URL in .env")
        print(f"Found: {db_url}")
        return

    print("Connecting to RDS...")
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Check if column type needs altering (Integer -> String)
        # Postgres is strict. If 'age' is INTEGER, we cannot store "5 Years".
        # We must ALTER the column type first.
        try:
            print("Checking/Altering 'age' column type to VARCHAR...")
            cursor.execute("ALTER TABLE patients ALTER COLUMN age TYPE VARCHAR;")
            conn.commit()
            print("Column type updated/verified.")
        except Exception as e:
            conn.rollback()
            print(f"Column alter skipped (maybe already VARCHAR): {e}")

        print("Fetching patients...")
        cursor.execute("SELECT record_id, dob, age FROM patients")
        rows = cursor.fetchall()
        
        updated_count = 0
        
        for row in rows:
            record_id, dob, current_age = row
            
            if dob:
                new_age = calculate_age_string(dob)
                # Convert current_age to string for comparison if it was int
                str_current_age = str(current_age) if current_age is not None else ""
                
                if new_age and new_age != str_current_age:
                    print(f"ID {record_id}: {str_current_age} -> {new_age}")
                    cursor.execute("UPDATE patients SET age = %s WHERE record_id = %s", (new_age, record_id))
                    updated_count += 1
            
            elif current_age:
                 # Legacy Int check
                 try:
                     int_val = int(current_age)
                     new_val = f"{int_val} Years"
                     if new_val != current_age:
                         cursor.execute("UPDATE patients SET age = %s WHERE record_id = %s", (new_val, record_id))
                         updated_count += 1
                 except:
                     pass

        conn.commit()
        print(f"\nSUCCESS: Updated {updated_count} records on RDS.")
        
    except Exception as e:
        print(f"Connection Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    repair_rds()
