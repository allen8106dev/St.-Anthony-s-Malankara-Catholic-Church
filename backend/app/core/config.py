from functools import lru_cache
from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Church Platform API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    SECRET_KEY: str
    CORS_ORIGINS: str = "http://localhost:5173"
    COOKIE_SECURE: bool = False
    SESSION_COOKIE_NAME: str = "church_admin_session"
    SESSION_EXPIRE_MINUTES: int = 480
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @model_validator(mode="after")
    def production_security(self):
        if "*" in self.cors_origins:
            raise ValueError("CORS_ORIGINS must not contain '*' when credentialed cookies are enabled.")
        if self.is_production and (not self.COOKIE_SECURE or self.SECRET_KEY.startswith("replace-with-")):
            raise ValueError("Production requires a non-placeholder secret and COOKIE_SECURE=true.")
        return self

@lru_cache
def get_settings() -> Settings: return Settings()

settings = get_settings()
