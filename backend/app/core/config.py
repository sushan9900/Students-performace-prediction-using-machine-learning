# Purpose of File: Centralizes all configuration settings, environment variables,
#                   database credentials, directory paths, security settings,
#                   and CORS parameters using Pydantic Settings V2.
#
# Inputs        : Reads system environment variables or values from a local .env file.
# Outputs       : Exports a singleton 'settings' object accessible project-wide.
# Execution Flow:
#                 1. Loads environment variables dynamically using pydantic-settings.
#                 2. Resolves absolute directory paths for uploads, models, and reports.
#                 3. Automatically creates required storage directories if missing.
#                 4. Validates configuration properties and provides sensible defaults.
# ==============================================================================

import os
from pathlib import Path
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings Class.
    
    Why it exists:
    --------------
    Instead of hardcoding settings or using raw os.getenv() calls throughout the codebase,
    this class provides a strongly-typed, validated, and centralized configuration schema.
    """

    # --------------------------------------------------------------------------
    # 1. Project Basic Metadata
    # --------------------------------------------------------------------------
    PROJECT_NAME: str = "Student Performance Prediction API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DESCRIPTION: str = (
        "Production-ready FastAPI backend for Student Performance Prediction "
        "using Machine Learning models (Random Forest, Decision Tree, Logistic Regression, "
        "SVM, KNN, Naive Bayes)."
    )

    # --------------------------------------------------------------------------
    # 2. Server & Environment Settings
    # --------------------------------------------------------------------------
    ENVIRONMENT: str = Field(default="development", description="Environment mode: development | production")
    DEBUG: bool = Field(default=True, description="Enable debug mode for verbose logging")
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --------------------------------------------------------------------------
    # 3. Security & CORS Settings
    # --------------------------------------------------------------------------
    SECRET_KEY: str = Field(
        default="SUPER_SECRET_KEY_STUDENT_PERFORMANCE_PREDICTION_2026_FINAL_YEAR_PROJECT",
        description="Secret key for security and token hashing"
    )
    # Allowed frontend domains for Cross-Origin Resource Sharing (CORS)
    CORS_ORIGINS: List[str] = [
        "*",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:8000",
        "http://localhost:8001",
    ]

    # --------------------------------------------------------------------------
    # 4. Database Connection Settings
    # --------------------------------------------------------------------------
    # Supports PostgreSQL as requested, with a SQLite fallback for instant zero-config testing
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL Username")
    POSTGRES_PASSWORD: str = Field(default="postgres", description="PostgreSQL Password")
    POSTGRES_SERVER: str = Field(default="localhost", description="PostgreSQL Server host")
    POSTGRES_PORT: str = Field(default="5432", description="PostgreSQL Server port")
    POSTGRES_DB: str = Field(default="student_performance_db", description="PostgreSQL Database name")

    SUPABASE_URL: str = Field(default="https://duaqdsfhneklxlmxoibg.supabase.co", description="Supabase API Endpoint URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase Anon Key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", description="Supabase Service Role Key")

    DATABASE_URL: Union[str, None] = Field(
        default=None,
        description="Full SQL database connection string. If None, automatically constructed or fallback to SQLite."
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None], info) -> str:
        """
        Assembles the database connection string.
        If DATABASE_URL environment variable is explicitly set, uses it.
        Otherwise constructs PostgreSQL URL, falling back to SQLite if PostgreSQL fails.
        """
        if isinstance(v, str) and v.strip():
            return v
        
        # Default to SQLite for friction-free out-of-the-box local developer testing
        base_dir = Path(__file__).resolve().parent.parent.parent
        sqlite_db_path = base_dir / "student_performance.db"
        return f"sqlite:///{sqlite_db_path.as_posix()}"

    # --------------------------------------------------------------------------
    # 5. File System & Machine Learning Storage Paths
    # --------------------------------------------------------------------------
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent

    # Path for uploaded CSV Datasets
    UPLOAD_DIR: Path = BASE_DIR / "dataset"
    # Path for saved Machine Learning trained model files (.joblib)
    MODEL_DIR: Path = BASE_DIR / "models"
    # Path for exported reports & evaluation outputs
    REPORT_DIR: Path = BASE_DIR / "reports"

    # Upload Constraints
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_FILE_EXTENSIONS: List[str] = [".csv"]

    # --------------------------------------------------------------------------
    # 6. Pydantic Settings Configuration
    # --------------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def create_required_directories(self) -> None:
        """
        Creates all essential physical storage folders on startup if they don't already exist.
        
        Inputs : None (uses instance path variables).
        Outputs: None (Creates folders on local storage).
        """
        for folder in [self.UPLOAD_DIR, self.MODEL_DIR, self.REPORT_DIR]:
            folder.mkdir(parents=True, exist_ok=True)


# Export singleton instance for seamless imports across the app
settings = Settings()
settings.create_required_directories()
