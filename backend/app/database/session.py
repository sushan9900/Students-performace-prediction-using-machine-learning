# Purpose of File: Manages SQLAlchemy database engine creation, session instantiation,
#                   base declarative model class initialization, and FastAPI dependency
#                   injection for database connections.
#
# Inputs        : Database URL from app.core.config.settings.DATABASE_URL.
# Outputs       : Exports 'engine', 'SessionLocal', 'Base' class, and 'get_db()' generator.
# Execution Flow:
#                 1. Configures the database engine based on PostgreSQL or SQLite dialect.
#                 2. Initializes sessionmaker factory for creating transactional sessions.
#                 3. Defines Base class from which all database ORM models inherit.
#                 4. Provides get_db() generator function to handle database session scope
#                    and guarantee session closure after API request processing.
# ==============================================================================

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


# ------------------------------------------------------------------------------
# 1. Database Engine Initialization
# ------------------------------------------------------------------------------
# Configure engine options (e.g., SQLite requires check_same_thread=False for multi-threading)
db_url = settings.DATABASE_URL
engine_kwargs = {}
if db_url and db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        echo=settings.DEBUG,
        **engine_kwargs
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    # Fallback to local SQLite if PostgreSQL connection/DLL fails
    from pathlib import Path
    sqlite_path = settings.BASE_DIR / "student_performance.db"
    db_url = f"sqlite:///{sqlite_path.as_posix()}"
    engine = create_engine(
        db_url,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False}
    )

# ------------------------------------------------------------------------------
# 2. Session Factory Setup
# ------------------------------------------------------------------------------
# SessionLocal is a factory for creating individual database sessions per request
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ------------------------------------------------------------------------------
# 3. Base ORM Class
# ------------------------------------------------------------------------------
class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM database models in app/database/models.py.
    
    Why it exists:
    --------------
    SQLAlchemy models inherit from Base so that the metadata registry can track
    all database tables and automatically create them via Base.metadata.create_all(bind=engine).
    """
    pass


# ------------------------------------------------------------------------------
# 4. FastAPI Dependency Injector Function
# ------------------------------------------------------------------------------
def get_db() -> Generator:
    """
    FastAPI dependency that provides a database session to API route handlers.
    
    Why it exists:
    --------------
    Ensures that every API request gets its own isolated database session and that
    the session is guaranteed to close even if an unhandled exception occurs during request execution.
    
    Inputs : None
    Outputs: Yields a SQLAlchemy Session object to the caller route handler.
    
    Execution Flow:
    1. Instantiates a new SessionLocal() object.
    2. Yields the session to the FastAPI endpoint handler.
    3. Executes the finally block after response generation, calling db.close().
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
