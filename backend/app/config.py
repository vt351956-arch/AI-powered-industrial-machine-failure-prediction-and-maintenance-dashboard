import os
from pathlib import Path
from typing import List, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Predictive Maintenance for Industry 4.0"
    ENV_MODE: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"

    # Security & JWT
    SECRET_KEY: str = Field(
        default="industrial-secret-key-32-chars-long-industry-40-jwt",
        description="Secret key for JWT generation and verification",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # PostgreSQL Database URL
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/predictive_maintenance",
        description="PostgreSQL Connection URI",
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace(
                "postgresql://",
                "postgresql+psycopg2://",
                1,
            )
        return v

    # Machine Learning
    MODEL_DIR: str = Field(
        default="ml/models",
        description="Path to saved joblib model artifacts",
    )
    MODEL_VERSION: str = "random-forest-v1"

    # CORS: allow the local Vite frontend
    BACKEND_CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(
        cls,
        v: Union[str, List[str]],
    ) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                return v
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        raise ValueError("Invalid BACKEND_CORS_ORIGINS configuration")

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
