from functools import lru_cache
from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Church Platform API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    ALEMBIC_DATABASE_URL: str | None = None
    SECRET_KEY: str
    CORS_ORIGINS: str = "http://localhost:5173"
    COOKIE_SECURE: bool = False
    SESSION_COOKIE_NAME: str = "church_admin_session"
    SESSION_EXPIRE_MINUTES: int = 480
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    SUPABASE_STORAGE_BUCKET: str = "church-media"
    MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[3] / ".env",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def migration_database_url(self) -> str:
        return self.ALEMBIC_DATABASE_URL or self.DATABASE_URL

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
