import logging
logger = logging.getLogger(__name__)
import os
import json
import shutil
from typing import List, Optional
from pydantic import SecretStr
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "THE DIGIFORT LABS"
    PROJECT_VERSION: str = "1.0.0"
    
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "digifortlabs")
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_BUCKET_NAME: str = os.getenv("AWS_BUCKET_NAME", "digifort-labs-files")

    # Redis / Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

    # Email / SMTP
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL")

    # Security
    # Using SecretStr to prevent accidental leaks in logs
    SECRET_KEY: SecretStr = SecretStr(os.getenv("SECRET_KEY", "super-secret-key-change-this-in-prod"))
    CSRF_SECRET_KEY: SecretStr = SecretStr(os.getenv("CSRF_SECRET_KEY", "csrf-secret-key-change-in-prod"))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # AI / Google Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    PLATFORM_AI_ENABLED: bool = os.getenv("PLATFORM_AI_ENABLED", "false").lower() == "true"

    # External Binaries
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", shutil.which("tesseract") or r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    POPPLER_PATH: Optional[str] = os.getenv("POPPLER_PATH", None) # Defaults to None if in PATH
    GHOSTSCRIPT_CMD: str = os.getenv("GHOSTSCRIPT_CMD", shutil.which("gswin64c") or shutil.which("gs") or "gswin64c")
    DEFAULT_COMPRESSION_STRATEGY: str = os.getenv("DEFAULT_COMPRESSION_STRATEGY", "BALANCED")
    
    @property
    def IS_UNSAFE_SECRET_KEY(self) -> bool:
        return self.SECRET_KEY.get_secret_value() == "super-secret-key-change-this-in-prod"
    
    # CORS - Read from environment or use defaults
    def __init__(self):
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        self.BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
        self.FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
        self.COOKIE_DOMAIN: str = os.getenv("COOKIE_DOMAIN", None)
        
        cors_env = os.getenv("BACKEND_CORS_ORIGINS")
        if cors_env:
            try:
                self.BACKEND_CORS_ORIGINS: List[str] = json.loads(cors_env)
            except json.JSONDecodeError:
                self.BACKEND_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
        else:
            self.BACKEND_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
            
        # Production Guardrails
        if self.ENVIRONMENT == "production":
            if self.IS_UNSAFE_SECRET_KEY:
                # We log a critical error but don't crash yet to allow the user to see the logs
                logger.info("[CRITICAL] SECURITY ALERT: Running in production with default SECRET_KEY!")
                # In a real environment, you might raise a ValueError here to prevent startup
                # raise ValueError("Insecure SECRET_KEY in production environment")

settings = Settings()
