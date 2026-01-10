import sqlite3


def migrate():
    try:
        conn = sqlite3.connect('d:/Website/DIGIFORTLABS/backend/digifort_v5.db')
        cursor = conn.cursor()
        cursor.execute("ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT 0")
        conn.commit()
        print("Migration successful: Added force_password_change column to digifort_v5.db")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
