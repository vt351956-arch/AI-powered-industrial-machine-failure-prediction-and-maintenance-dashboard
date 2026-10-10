from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SensorReadingBase(BaseModel):
    temperature: float = Field(
        ..., ge=-20.0, le=200.0,
        description="Temperature in °C",
        json_schema_extra={"example": 68.5}
    )
    vibration: float = Field(
        ..., ge=0.0, le=50.0,
        description="Vibration in mm/s RMS",
        json_schema_extra={"example": 2.3}
    )
    pressure: float = Field(
        ..., ge=0.0, le=50.0,
        description="Pressure in bar",
        json_schema_extra={"example": 4.1}
    )
    rpm: float = Field(
        ..., ge=0.0, le=10000.0,
        description="Revolutions per minute",
        json_schema_extra={"example": 1780.0}
    )
    power_consumption: float = Field(
        ..., ge=0.0, le=500.0,
        description="Power in kW",
        json_schema_extra={"example": 15.2}
    )
    operating_hours: float = Field(
        ..., ge=0.0,
        description="Accumulated operating hours",
        json_schema_extra={"example": 3420.5}
    )


class SensorReadingCreate(SensorReadingBase):
    machine_id: str = Field(
        ..., json_schema_extra={"example": "uuid-string"}
    )
    timestamp: Optional[datetime] = None


class SensorReadingResponse(SensorReadingBase):
    id: str
    machine_id: str
    timestamp: datetime
    is_anomaly: bool = False
    anomaly_score: float = 0.0

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "machine_id", mode="before")
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value


class SyntheticSensorBatchRequest(BaseModel):
    machine_id: str
    count: int = Field(default=20, ge=1, le=200)
    stress_mode: Optional[str] = Field(
        default="NORMAL",
        json_schema_extra={"example": "NORMAL"}
    )  # NORMAL, THERMAL, BEARING, HYDRAULIC
