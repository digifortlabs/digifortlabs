import os
from dotenv import load_dotenv

load_dotenv()

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

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-this-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://tools.codexshop.in",
        "https://digifortlabs.com",
    ]

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

settings = Settings()
