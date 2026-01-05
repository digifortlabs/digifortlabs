from app.database import engine, Base
from app import models # Import models to register them
from sqlalchemy import text

def init_db():
    print("🚀 Initializing AWS Database Schema...")
    try:
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        print("✅ Tables Created Successfully!")
        
        # Verify
        with engine.connect() as conn:
            result = conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public';"))
            tables = [row[0] for row in result]
            print(f"📋 Verified Tables: {tables}")
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    init_db()
