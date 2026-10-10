
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class DashboardSummary(BaseModel):
    total_machines: int
    healthy_machines: int
    warning_machines: int
    critical_machines: int
    offline_machines: int
    high_risk_predictions: int
    average_health_score: float
    total_anomalies_detected: int


class HealthTrendPoint(BaseModel):
    timestamp: str
    average_health: float
    healthy_count: int
    warning_count: int
    critical_count: int


class FailureRiskDistribution(BaseModel):
    low_risk: int
    medium_risk: int
    high_risk: int


class SensorTrendPoint(BaseModel):
    timestamp: str
    machine_code: str
    temperature: float
    vibration: float
    pressure: float
    rpm: float
    power_consumption: float
    is_anomaly: bool


class ScatterPoint(BaseModel):
    machine_code: str
    machine_name: str
    temperature: float
    vibration: float
    health_score: float
    risk_level: str


class MachineHealthBar(BaseModel):
    machine_id: str
    machine_code: str
    machine_name: str
    health_score: float
    risk_level: str
    status: str

    @field_validator("machine_id", mode="before")
    @classmethod
    def convert_machine_id(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value


class MaintenanceCostPoint(BaseModel):
    month: str
    preventive_cost: float
    corrective_cost: float
    total_cost: float


class DashboardData(BaseModel):
    summary: DashboardSummary
    health_trend: List[HealthTrendPoint]
    risk_distribution: FailureRiskDistribution
    sensor_trends: List[SensorTrendPoint]
    scatter_points: List[ScatterPoint]
    machine_health_comparison: List[MachineHealthBar]
    maintenance_cost_trend: List[MaintenanceCostPoint]
    model_version: str
    is_demo_data: bool = True
