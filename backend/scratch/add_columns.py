import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def add_columns():
    query = text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'hospitals';
    """)
    
    with engine.connect() as conn:
        result = conn.execute(query)
        columns = [row[0] for row in result.fetchall()]
        print(f"Current columns in 'hospitals' table: {columns}")
        
        # Check max_users
        if 'max_users' not in columns:
            print("Adding 'max_users' column...")
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN max_users INTEGER DEFAULT 2;"))
            print("'max_users' column added.")
        else:
            print("'max_users' already exists.")
            
        # Check per_user_price
        if 'per_user_price' not in columns:
            print("Adding 'per_user_price' column...")
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN per_user_price DOUBLE PRECISION DEFAULT 0.0;"))
            print("'per_user_price' column added.")
        else:
            print("'per_user_price' already exists.")
            
        # Check extra_user_price
        if 'extra_user_price' not in columns:
            print("Adding 'extra_user_price' column...")
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN extra_user_price DOUBLE PRECISION DEFAULT 0.0;"))
            print("'extra_user_price' column added.")
        else:
            print("'extra_user_price' already exists.")
            
        # Commit transaction
        conn.commit()
        print("Columns checking and updating completed successfully!")

if __name__ == "__main__":
    add_columns()
