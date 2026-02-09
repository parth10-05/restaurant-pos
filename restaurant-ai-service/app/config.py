"""
Application configuration using pydantic-settings
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # App
    app_name: str = "Restaurant AI Service"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"]
    
    # Model Settings
    random_seed: int = 42
    forecast_horizon_days: int = 7
    confidence_level: float = 0.95
    
    # Cache Settings
    cache_ttl_seconds: int = 300
    cache_max_size: int = 1000
    
    # Logging
    log_level: str = "INFO"
    log_json: bool = True
    
    # Feature Flags
    enable_prophet: bool = True
    enable_arima_fallback: bool = True
    
    class Config:
        env_file = ".env"
        env_prefix = "AI_SERVICE_"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Module-level settings instance for convenient imports
settings = get_settings()
