import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("Attempting to import app.main...")
try:
    from app.main import app
    print("✅ Successfully imported app.main")
except ImportError as e:
    print(f"❌ ImportError: {e}")
    import traceback
    traceback.print_exc()
except SyntaxError as e:
    print(f"❌ SyntaxError: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"❌ General Exception during import: {e}")
    import traceback
    traceback.print_exc()
