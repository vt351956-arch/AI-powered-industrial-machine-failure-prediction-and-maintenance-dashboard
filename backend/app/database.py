import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("uvicorn.error")

# SQLAlchemy connection arguments
connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "use_insertmanyvalues": False,
}

if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
else:
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        **engine_kwargs
    )
except Exception as e:
    logger.error(f"[DB INIT ERROR] Could not create database engine with URL: {settings.DATABASE_URL}. Error: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a SQLAlchemy session per request
    and handles graceful commit/rollback/close.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """
    Verify PostgreSQL connectivity and log detailed diagnostics.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("[DATABASE] Successfully connected to PostgreSQL database.")
        return True
    except Exception as exc:
        logger.warning(
            f"[DATABASE CONNECTION NOTICE] Unable to connect to PostgreSQL at {settings.DATABASE_URL}.\n"
            f"Details: {exc}\n"
            "Please ensure your PostgreSQL server is running and database exists."
        )
        return False


def init_db():
    """
    Creates all relational tables defined in the SQLAlchemy models.
    """
    import app.models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)
