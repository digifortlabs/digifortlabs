import sys
import os
sys.path.append(os.getcwd())

from app.main import app

print("🔍 Listing all registered routes:")
for route in app.routes:
    methods = getattr(route, "methods", "N/A")
    print(f"{methods} {route.path}")

print("🏁 Done.")
