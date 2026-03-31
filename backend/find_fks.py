import os
from sqlalchemy import create_engine, MetaData

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db")
engine = create_engine(DATABASE_URL)
metadata = MetaData()
metadata.reflect(bind=engine)

print("Foreign Keys referencing 'users':")
for table in metadata.tables.values():
    for fk in table.foreign_keys:
        if fk.column.table.name == 'users':
            print(f"- {table.name}.{fk.parent.name}")

print("\nForeign Keys referencing 'hospitals':")
for table in metadata.tables.values():
    for fk in table.foreign_keys:
        if fk.column.table.name == 'hospitals':
            print(f"- {table.name}.{fk.parent.name}")
            
print("\nForeign Keys referencing 'patients':")
for table in metadata.tables.values():
    for fk in table.foreign_keys:
        if fk.column.table.name == 'patients':
            print(f"- {table.name}.{fk.parent.name}")
