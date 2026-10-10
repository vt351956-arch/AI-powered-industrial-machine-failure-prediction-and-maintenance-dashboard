from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MaintenanceBase(BaseModel):
    machine_id: str = Field(..., json_schema_extra={"example": "uuid-string"})
    maintenance_date: date = Field(..., json_schema_extra={"example": "2025-02-20"})
    maintenance_type: str = Field(
        ..., json_schema_extra={"example": "PREVENTIVE"}
    )  # PREVENTIVE, CORRECTIVE, INSPECTION, OVERHAUL
    description: str = Field(
        ..., min_length=3,
        json_schema_extra={"example": "Routine bearing lubrication and vibration check"}
    )
    technician: str = Field(
        ..., min_length=2,
        json_schema_extra={"example": "Alex Mercer"}
    )
    cost: float = Field(
        default=0.0, ge=0.0,
        json_schema_extra={"example": 450.0}
    )


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    maintenance_date: Optional[date] = None
    maintenance_type: Optional[str] = None
    description: Optional[str] = None
    technician: Optional[str] = None
    cost: Optional[float] = None


class MaintenanceResponse(MaintenanceBase):
    id: str
    created_at: datetime
    machine_name: Optional[str] = None
    machine_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "machine_id", mode="before")
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value
