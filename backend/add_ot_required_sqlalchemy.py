from sqlalchemy import text
from app.database import engine

def upgrade():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE ipd_admissions ADD COLUMN ot_required BOOLEAN DEFAULT FALSE;"))
            conn.commit()
            print("Successfully added ot_required column.")
        except Exception as e:
            if "already exists" in str(e) or "Duplicate column" in str(e):
                print("Column already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    upgrade()
