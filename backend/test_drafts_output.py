from app.database import SessionLocal
from app.models import PDFFile, Patient, User, UserRole
from app.routers.storage import list_pending_drafts
from unittest.mock import MagicMock

db = SessionLocal()

# Mock a superadmin user
mock_user = MagicMock(spec=User)
mock_user.role = UserRole.SUPER_ADMIN
mock_user.hospital_id = 1
mock_user.user_id = 1

# Call the function directly
drafts = list_pending_drafts(db=db, current_user=mock_user)

print(f"Total drafts returned: {len(drafts)}")
for d in drafts[:15]:
    print(d)

db.close()
