from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    DEBUG: bool = True
    SECRET_KEY: str = "TtoxFdBbtVNBY3erNhsQGp3eG6h9YhycaH4qKCHzGxA"
    
    # Database Settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./sql_app.db"
    
    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # JWT Settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # ML Service Settings
    ML_SERVICE_URL: str = "http://localhost:8001"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

