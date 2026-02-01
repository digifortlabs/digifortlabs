
from sqlalchemy import text
from app.database import engine

def run_fix():
    print("🛠️ Fixing system_settings table...")
    with engine.connect() as conn:
        try:
            # 1. Backup existing settings (though it's just announcement usually)
            result = conn.execute(text("SELECT key, value FROM system_settings"))
            existing_data = result.fetchall()
            
            # 2. Drop and Recreate
            conn.execute(text("DROP TABLE IF EXISTS system_settings"))
            conn.execute(text("""
                CREATE TABLE system_settings (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR UNIQUE NOT NULL,
                    value VARCHAR,
                    description VARCHAR
                )
            """))
            print("✅ Table recreated with SERIAL id.")
            
            # 3. Restore data
            for key, value in existing_data:
                conn.execute(
                    text("INSERT INTO system_settings (key, value) VALUES (:key, :value)"),
                    {"key": key, "value": value}
                )
            conn.commit()
            print(f"✅ Restored {len(existing_data)} settings.")
        except Exception as e:
            print(f"❌ Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    run_fix()
