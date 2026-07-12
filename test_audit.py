import sys
sys.path.insert(0, 'backend')
from app.database import SessionLocal, engine
from app.models import Base, SystemSetting, AuditLog
from app.context import set_current_user_id, set_current_hospital_id

# Setup the listener
from app.auditing import setup_auditing
setup_auditing()

# Ensure we have a database to test against
Base.metadata.create_all(bind=engine)

def run_test():
    db = SessionLocal()
    
    # Mock auth context
    set_current_user_id(999)
    set_current_hospital_id(888)
    
    # Create test setting
    setting = SystemSetting(key="test_audit_key", value="initial_value", description="Test")
    db.add(setting)
    db.commit()
    
    # Check if CREATE was logged
    logs = db.query(AuditLog).filter(AuditLog.user_id == 999).all()
    print(f"Audit logs after CREATE: {len(logs)}")
    
    # Update setting
    setting = db.query(SystemSetting).filter_by(key="test_audit_key").first()
    setting.value = "updated_value"
    db.commit()
    
    logs = db.query(AuditLog).filter(AuditLog.user_id == 999).all()
    print(f"Audit logs after UPDATE: {len(logs)}")
    
    if len(logs) > 1:
        print(f"UPDATE details: {logs[-1].details}")
        
    db.close()

if __name__ == "__main__":
    run_test()
