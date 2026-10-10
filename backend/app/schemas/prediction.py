from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PredictionInput(BaseModel):
    temperature: float = Field(..., ge=-20.0, le=200.0, json_schema_extra={"example": 88.5}, description="Temperature in °C")
    vibration: float = Field(..., ge=0.0, le=50.0, json_schema_extra={"example": 6.2}, description="Vibration in mm/s RMS")
    pressure: float = Field(..., ge=0.0, le=50.0, json_schema_extra={"example": 3.9}, description="Pressure in bar")
    rpm: float = Field(..., ge=0.0, le=10000.0, json_schema_extra={"example": 1720.0}, description="RPM")
    power_consumption: float = Field(..., ge=0.0, le=500.0, json_schema_extra={"example": 28.4}, description="Power in kW")
    operating_hours: float = Field(..., ge=0.0, json_schema_extra={"example": 8500.0}, description="Operating hours")
    machine_id: Optional[str] = Field(default=None, description="Optional machine ID to persist prediction to database")


class PredictionOutput(BaseModel):
    failure_probability: float = Field(..., json_schema_extra={"example": 0.87}, description="Probability of failure (0.0 to 1.0)")
    health_score: float = Field(..., json_schema_extra={"example": 32.0}, description="Estimated machine health score (0 to 100)")
    risk_level: str = Field(..., json_schema_extra={"example": "HIGH"}, description="Risk category: LOW, MEDIUM, HIGH")
    predicted_failure: bool = Field(..., json_schema_extra={"example": True}, description="True if failure is imminent")
    model_version: str = Field(..., json_schema_extra={"example": "random-forest-v1"})
    anomaly_detected: bool = Field(default=False, description="Unsupervised outlier flag from Isolation Forest")
    anomaly_score: float = Field(default=0.0, description="Isolation Forest decision score")
    prediction_time: Optional[datetime] = None
    prediction_id: Optional[str] = None
    machine_id: Optional[str] = None

    @field_validator("prediction_id", "machine_id", mode="before")
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value


class PredictionRecordResponse(BaseModel):
    id: str
    machine_id: str
    prediction_time: datetime
    failure_probability: float
    health_score: float
    risk_level: str
    predicted_failure: bool
    model_version: str

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "machine_id", mode="before")
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value
