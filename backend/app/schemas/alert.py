from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class AlertItem(BaseModel):
    id: str
    machine_id: str
    machine_code: str
    machine_name: str
    alert_type: str  # HIGH_RISK, SENSOR_ANOMALY, CRITICAL_STATUS
    severity: str  # CRITICAL, WARNING, INFO
    title: str
    message: str
    metric_value: Optional[float] = None
    metric_unit: Optional[str] = None
    timestamp: datetime

    @field_validator("id", "machine_id", mode="before")
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value
