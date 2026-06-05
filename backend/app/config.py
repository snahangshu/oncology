from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    SECRET_KEY: str = Field(default="change-this-in-production-super-secret-key-12345")
    API_PREFIX: str = Field(default="/api/v1")

    # Database Configuration
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/oncology_ai")

    # Redis & Celery
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/2")

    # AI Services
    ANTHROPIC_API_KEY: str = Field(default="your-claude-api-key-here")
    OPENAI_API_KEY: str = Field(default="your-openai-api-key-here")
    OMNIDIMENSION_API_KEY: str = Field(default="")

    # FHIR ARIA Integration
    FHIR_BASE_URL: str = Field(default="https://aria-fhir.hospital-system.org/r4")
    FHIR_CLIENT_ID: str = Field(default="your-aria-client-id")
    FHIR_CLIENT_SECRET: str = Field(default="your-aria-client-secret")

    # WebSocket Configuration
    WS_HEARTBEAT_INTERVAL_SEC: int = Field(default=30)

    # Cloudinary Integration
    CLOUDINARY_CLOUD_NAME: str = Field(default="")
    CLOUDINARY_API_KEY: str = Field(default="")
    CLOUDINARY_API_SECRET: str = Field(default="")

settings = Settings()
