from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import SQLALCHEMY_DATABASE_URL
from app.models import IPDAdmission, Ward

engine = create_engine(SQLALCHEMY_DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

adms = db.query(IPDAdmission).all()
print('Admissions:')
for a in adms:
    rate = getattr(a.ward, "daily_charge", None) if a.ward else None
    print(f'ID: {a.admission_id}, Status: {a.status}, Ward: {a.ward_id}, Rate: {rate}')
