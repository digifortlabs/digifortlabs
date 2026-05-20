from fastapi_csrf_protect import CsrfProtect
import inspect

print("Methods in CsrfProtect:")
for name, member in inspect.getmembers(CsrfProtect):
    if not name.startswith("__"):
        print(f" - {name}")
