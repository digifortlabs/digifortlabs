from app.database import engine, Base
from app.models import *

print("Creating missing tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
