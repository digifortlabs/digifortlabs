"""
Quick fix for system_settings table on local database
Run this from the backend directory
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    sys.exit(1)

print(f"🔗 Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check if table exists
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'system_settings'
        );
    """))
    table_exists = result.scalar()
    
    if not table_exists:
        print("📋 Creating system_settings table...")
        conn.execute(text("""
            CREATE TABLE system_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.commit()
        print("✅ Table created successfully!")
    else:
        print("✅ Table already exists")
    
    # Check if id column is SERIAL PRIMARY KEY
    result = conn.execute(text("""
        SELECT column_default 
        FROM information_schema.columns 
        WHERE table_name = 'system_settings' AND column_name = 'id';
    """))
    default_value = result.scalar()
    
    if default_value and 'nextval' in str(default_value):
        print("✅ ID column is properly configured as SERIAL")
    else:
        print("🔧 Fixing ID column...")
        conn.execute(text("""
            ALTER TABLE system_settings 
            ALTER COLUMN id SET DEFAULT nextval('system_settings_id_seq'::regclass);
        """))
        conn.commit()
        print("✅ ID column fixed!")
    
    # Insert default settings if they don't exist
    print("📝 Checking default settings...")
    
    defaults = [
        ('maintenance_mode', 'false'),
        ('announcement', '')
    ]
    
    for key, value in defaults:
        result = conn.execute(text(f"SELECT COUNT(*) FROM system_settings WHERE key = '{key}'"))
        if result.scalar() == 0:
            conn.execute(text(f"INSERT INTO system_settings (key, value) VALUES ('{key}', '{value}')"))
            print(f"  ✅ Added default: {key} = {value}")
    
    conn.commit()
    
    # Show current settings
    print("\n📊 Current settings:")
    result = conn.execute(text("SELECT key, value FROM system_settings"))
    for row in result:
        print(f"  {row[0]}: {row[1]}")

print("\n✅ Database fix complete!")
