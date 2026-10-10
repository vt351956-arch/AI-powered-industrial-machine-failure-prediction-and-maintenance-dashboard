from app.routers.auth import router as auth_router
from app.routers.machines import router as machines_router
from app.routers.sensors import router as sensors_router
from app.routers.predictions import router as predictions_router
from app.routers.maintenance import router as maintenance_router
from app.routers.dashboard import router as dashboard_router
from app.routers.alerts import router as alerts_router

__all__ = [
    "auth_router",
    "machines_router",
    "sensors_router",
    "predictions_router",
    "maintenance_router",
    "dashboard_router",
    "alerts_router",
]
