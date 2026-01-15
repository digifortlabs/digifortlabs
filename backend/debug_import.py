
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.routers.storage...")
    from app.routers import storage
    print("Import successful!")
except Exception as e:
    print(f"Import FAILED: {e}")
    import traceback
    traceback.print_exc()
