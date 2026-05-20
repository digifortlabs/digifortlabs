from fastapi_csrf_protect import CsrfProtect
import asyncio

print(f"Is validate_csrf async? {asyncio.iscoroutinefunction(CsrfProtect.validate_csrf)}")
