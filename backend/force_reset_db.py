import os
import time

DB_FILE = "digifortlabs.db"

def force_reset():
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
            print(f"✅ Successfully deleted {DB_FILE}")
        except PermissionError:
            print(f"❌ Cannot delete {DB_FILE}. It is being used by another process.")
        except Exception as e:
            print(f"❌ Error deleting {DB_FILE}: {e}")
    else:
        print(f"ℹ️ {DB_FILE} does not exist (Clean slate).")

if __name__ == "__main__":
    force_reset()
