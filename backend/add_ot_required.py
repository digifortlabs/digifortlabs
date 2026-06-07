import sqlite3

def upgrade():
    conn = sqlite3.connect('digifortlabs.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE ipd_admissions ADD COLUMN ot_required BOOLEAN DEFAULT 0")
        print("Column ot_required added successfully.")
    except Exception as e:
        print(f"Error: {e}")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
