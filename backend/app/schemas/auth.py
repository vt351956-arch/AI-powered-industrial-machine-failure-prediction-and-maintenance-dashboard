from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        json_schema_extra={"example": "Jane Doe"}
    )

    email: EmailStr = Field(
        ...,
        json_schema_extra={"example": "jane.doe@smartplant.com"}
    )

    password: str = Field(
        ...,
        min_length=6,
        max_length=128,
        json_schema_extra={"example": "Secret123!"}
    )

    role: str = Field(
        default="engineer",
        json_schema_extra={"example": "engineer"}
    )


class UserLogin(BaseModel):
    email: EmailStr = Field(
        ...,
        json_schema_extra={"example": "jane.doe@smartplant.com"}
    )

    password: str = Field(
        ...,
        min_length=1,
        json_schema_extra={"example": "Secret123!"}
    )


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", mode="before")
    @classmethod
    def convert_uuid_to_string(cls, value):
        if isinstance(value, UUID):
            return str(value)
        return value


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None