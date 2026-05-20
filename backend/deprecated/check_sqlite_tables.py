import sqlite3
import os

def check_sqlite(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path}, not found.")
        return
    
    print(f"--- Checking {db_path} ---")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("Tables found:")
        for table in tables:
            print(f"  - {table[0]}")
            if table[0] == "user_trusted_devices":
                print("    ✅ Table 'user_trusted_devices' EXISTS!")
                cursor.execute("PRAGMA table_info(user_trusted_devices);")
                columns = cursor.fetchall()
                for col in columns:
                    print(f"      Col: {col[1]} ({col[2]})")
        conn.close()
    except Exception as e:
        print(f"Error checking {db_path}: {e}")

if __name__ == "__main__":
    check_sqlite("digifortlabs.db")
    check_sqlite("database.db")
