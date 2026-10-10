from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MachineBase(BaseModel):
    machine_code: str = Field(
        ...,
        min_length=2,
        max_length=50,
        json_schema_extra={"example": "CNC-PUMP-01"}
    )

    machine_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        json_schema_extra={"example": "Main Coolant Pump Alpha"}
    )

    machine_type: str = Field(
        ...,
        min_length=2,
        max_length=50,
        json_schema_extra={"example": "Centrifugal Pump"}
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=100,
        json_schema_extra={"example": "Sector 4 - Machine Hall B"}
    )

    installation_date: date = Field(
        ...,
        json_schema_extra={"example": "2023-01-15"}
    )

    status: str = Field(
        default="HEALTHY",
        json_schema_extra={"example": "HEALTHY"}
    )


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    machine_name: Optional[str] = None
    machine_type: Optional[str] = None
    location: Optional[str] = None
    installation_date: Optional[date] = None
    status: Optional[str] = None


class MachineResponse(MachineBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime

    latest_health_score: Optional[float] = None
    latest_risk_level: Optional[str] = None
    latest_failure_probability: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "created_by", mode="before")
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value


class MachineDetailResponse(MachineResponse):
    latest_sensor_reading: Optional[dict] = None
    total_operating_hours: Optional[float] = 0.0
    total_maintenance_records: int = 0
    total_predictions: int = 0