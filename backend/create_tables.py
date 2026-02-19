from app.database import engine, Base
from app.models import *

print("Creating all missing tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
