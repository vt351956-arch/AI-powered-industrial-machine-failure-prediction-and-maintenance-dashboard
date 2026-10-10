import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import check_db_connection, init_db
from app.routers import (
    alerts_router,
    auth_router,
    dashboard_router,
    machines_router,
    maintenance_router,
    predictions_router,
    sensors_router,
)
from app.services.ml_service import ml_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("predictive_maintenance_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle management.
    """
    logger.info("=" * 65)
    logger.info(" INITIALIZING AI-POWERED PREDICTIVE MAINTENANCE BACKEND")
    logger.info("=" * 65)

    # 1. Database Connectivity & Schema Initialization
    db_connected = check_db_connection()
    if db_connected:
        try:
            init_db()
            logger.info("[DATABASE] PostgreSQL tables initialized and ready.")
        except Exception as e:
            logger.error(f"[DATABASE ERROR] Could not verify/initialize tables: {e}")
    else:
        logger.warning(
            "[DATABASE NOTICE] Operating without live PostgreSQL connection.\n"
            "To connect, ensure PostgreSQL is started at port 5432 and run 'python seed_data.py'."
        )

    # 2. Machine Learning Model Verification
    if ml_service.is_loaded:
        logger.info(f"[ML SERVICE] Model {ml_service.model_version} active and ready for inference.")
    else:
        logger.warning("[ML SERVICE] Model loading deferred or awaiting training.")

    logger.info("=" * 65)
    yield
    logger.info("Shutting down Predictive Maintenance API...")


app = FastAPI(
    title="AI-Powered Predictive Maintenance for Industry 4.0",
    description=(
        "Full-stack REST API for real-time equipment telemetry ingestion, "
        "health index computation, Random Forest failure forecasting, and "
        "Isolation Forest anomaly detection."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "details": exc.errors(),
            "body": exc.body,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"[UNHANDLED EXCEPTION] {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected server error occurred.",
        },
    )


# Include Sub-Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(machines_router, prefix=settings.API_V1_PREFIX)
app.include_router(sensors_router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions_router, prefix=settings.API_V1_PREFIX)
app.include_router(maintenance_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root_overview():
    return {
        "project": settings.PROJECT_NAME,
        "environment": settings.ENV_MODE,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_v1_prefix": settings.API_V1_PREFIX,
        "model_version": ml_service.model_version,
        "status": "online",
        "disclaimer": "Academic & portfolio predictive maintenance demonstration platform.",
    }


@app.get("/health")
@app.get(f"{settings.API_V1_PREFIX}/health")
def health_check():
    db_ok = check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database_connected": db_ok,
        "ml_model_loaded": ml_service.is_loaded,
        "model_version": ml_service.model_version,
    }
