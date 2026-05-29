import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import InventoryItem, InventoryLog, User, Hospital

# Create an in-memory SQLite database for testing cascade behavior
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(name="db_session")
def fixture_db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all tables in the test database
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_inventory_item_cascade_delete(db_session):
    # 1. Create a mock hospital
    hospital = Hospital(
        legal_name="Test Hospital",
        email="hospital@test.com"
    )
    db_session.add(hospital)
    db_session.commit()
    db_session.refresh(hospital)

    # 2. Create a mock user
    user = User(
        email="admin@test.com",
        full_name="Admin User",
        hashed_password="fakehash",
        role="hospital_admin",
        hospital_id=hospital.hospital_id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # 3. Create an inventory item
    item = InventoryItem(
        hospital_id=hospital.hospital_id,
        name="Test Syringe",
        category="Consumables",
        unit_price=10.0,
        reorder_point=5,
        unit="pcs",
        current_stock=100
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    # 4. Create an inventory log
    log = InventoryLog(
        hospital_id=hospital.hospital_id,
        item_id=item.item_id,
        change_type="IN",
        quantity=100,
        description="Initial stock",
        performed_by=user.user_id
    )
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)

    # Verify initial state
    assert db_session.query(InventoryItem).filter(InventoryItem.item_id == item.item_id).first() is not None
    assert db_session.query(InventoryLog).filter(InventoryLog.id == log.id).first() is not None

    # 5. Delete the inventory item
    db_session.delete(item)
    db_session.commit()

    # 6. Verify that both the inventory item AND the inventory log have been deleted
    assert db_session.query(InventoryItem).filter(InventoryItem.item_id == item.item_id).first() is None
    assert db_session.query(InventoryLog).filter(InventoryLog.id == log.id).first() is None
