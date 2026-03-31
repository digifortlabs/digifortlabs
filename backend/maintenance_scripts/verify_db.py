from sqlalchemy import text
from app.database import engine
from app.models import PhysicalBox
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify():
    db = SessionLocal()
    try:
        print("Querying PhysicalBox...")
        boxes = db.query(PhysicalBox).limit(5).all()
        for b in boxes:
            print(f"Box: {b.label}, Cat: {b.category}")
        print("✅ Query successful. Column 'category' works.")
    except Exception as e:
        print(f"❌ Query failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
