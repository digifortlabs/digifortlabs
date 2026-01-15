
import sys
import os

sys.path.append(os.getcwd())

from app.main import app

print("\n--- Registered Routes ---")
for route in app.routes:
    methods = ", ".join(route.methods) if hasattr(route, "methods") else "None"
    print(f"{methods} {route.path}")
print("-------------------------\n")
