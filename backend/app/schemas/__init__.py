from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, TokenPayload
from app.schemas.machine import MachineBase, MachineCreate, MachineUpdate, MachineResponse, MachineDetailResponse
from app.schemas.sensor import SensorReadingBase, SensorReadingCreate, SensorReadingResponse, SyntheticSensorBatchRequest
from app.schemas.prediction import PredictionInput, PredictionOutput, PredictionRecordResponse
from app.schemas.maintenance import MaintenanceBase, MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
from app.schemas.dashboard import (
    DashboardSummary, HealthTrendPoint, FailureRiskDistribution,
    SensorTrendPoint, ScatterPoint, MachineHealthBar, MaintenanceCostPoint, DashboardData
)
from app.schemas.alert import AlertItem

__all__ = [
    "UserRegister", "UserLogin", "UserResponse", "Token", "TokenPayload",
    "MachineBase", "MachineCreate", "MachineUpdate", "MachineResponse", "MachineDetailResponse",
    "SensorReadingBase", "SensorReadingCreate", "SensorReadingResponse", "SyntheticSensorBatchRequest",
    "PredictionInput", "PredictionOutput", "PredictionRecordResponse",
    "MaintenanceBase", "MaintenanceCreate", "MaintenanceUpdate", "MaintenanceResponse",
    "DashboardSummary", "HealthTrendPoint", "FailureRiskDistribution",
    "SensorTrendPoint", "ScatterPoint", "MachineHealthBar", "MaintenanceCostPoint", "DashboardData",
    "AlertItem",
]
