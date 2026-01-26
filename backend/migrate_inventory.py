
from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def migrate_inventory():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("--- Migrating Inventory Tables ---")
        try:
            # Create Inventory Items Table
            q1 = """
            CREATE TABLE IF NOT EXISTS inventory_items (
                item_id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                category VARCHAR,
                current_stock INTEGER DEFAULT 0,
                unit_price FLOAT DEFAULT 0.0,
                reorder_point INTEGER DEFAULT 10,
                unit VARCHAR DEFAULT 'units',
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """
            conn.execute(text(q1))
            print("Creates/Verified table: inventory_items")

            # Create Inventory Logs Table
            q2 = """
            CREATE TABLE IF NOT EXISTS inventory_logs (
                log_id SERIAL PRIMARY KEY,
                item_id INTEGER NOT NULL REFERENCES inventory_items(item_id),
                change_type VARCHAR NOT NULL,
                quantity INTEGER NOT NULL,
                description VARCHAR,
                performed_by INTEGER REFERENCES users(user_id),
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """
            conn.execute(text(q2))
            print("Creates/Verified table: inventory_logs")
            
            conn.commit()
            print("Migration completed successfully.")
            
        except Exception as e:
            print(f"Migration Failed: {e}")

if __name__ == "__main__":
    migrate_inventory()
