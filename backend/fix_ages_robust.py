import sqlite3
from datetime import datetime, date
import os

# Database path
DB_PATH = "digifortlabs.db"

def calculate_age_string(dob_str):
    if not dob_str:
        return None
    
    try:
        # SQLite often returns strings for DateTime
        # Format might be "2024-01-01 00:00:00.000000" or "2024-01-01"
        dob_str = dob_str.split(' ')[0] # Get YYYY-MM-DD
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except ValueError:
        return None

    today = date.today()
    
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

def get_db_path():
    # 1. Check .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    url = line.strip().split("=")[1]
                    if "sqlite" in url:
                        return url.replace("sqlite:///", "")
    
    # 2. Check common names
    candidates = ["digifortlabs.db", "sql_app.db", "app.db", "database.db"]
    for c in candidates:
        if os.path.exists(c):
            return c
            
    # 3. Find any .db file
    files = [f for f in os.listdir(".") if f.endswith(".db")]
    if files:
        return files[0]
        
    return "digifortlabs.db"

def repair_db():
    db_path = get_db_path()
    print(f"Targeting Database: {db_path}")

    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found in current directory.")
        print(f"Current Directory contains: {os.listdir('.')}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check tables first
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cursor.fetchall()]
        print(f"Found Tables: {tables}")
        
        if 'patients' not in tables:
            print("ERROR: 'patients' table not found in this database!")
            return

        print("Reading patients...")
        cursor.execute("SELECT record_id, dob, age FROM patients")
        rows = cursor.fetchall()
        
        updated_count = 0
        
        for row in rows:
            record_id, dob, current_age = row
            
            if dob:
                new_age = calculate_age_string(dob)
                if new_age and new_age != current_age:
                    # check if current age is weird (like -2)
                    print(f"ID {record_id}: Old='{current_age}' -> New='{new_age}'")
                    cursor.execute("UPDATE patients SET age = ? WHERE record_id = ?", (new_age, record_id))
                    updated_count += 1
            elif current_age:
                # If no DOB but Age exists as Int, make it string
                try:
                    int_age = int(current_age)
                    new_str_age = f"{int_age} Years"
                    if new_str_age != current_age:
                        cursor.execute("UPDATE patients SET age = ? WHERE record_id = ?", (new_str_age, record_id))
                        updated_count += 1
                except:
                    pass

        conn.commit()
        print(f"\nSUCCESS: Updated {updated_count} records.")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    repair_db()
