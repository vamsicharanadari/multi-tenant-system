from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Multi-Tenant System"
    SECRET_KEY: str = "super-secret-key-for-jwt-signing"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    IMPERSONATION_EXPIRE_MINUTES: int = 15
    
    CONTROL_DB_URL: str = "sqlite+aiosqlite:///:memory:"
    REDIS_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
