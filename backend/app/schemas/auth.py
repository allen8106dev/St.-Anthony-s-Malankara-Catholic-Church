from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.domain import RoleName

def normalize_email(value: str) -> str:
    return value.strip().casefold()

class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=1024)
    @field_validator("email")
    @classmethod
    def normalized_email(cls, value: str) -> str:
        value = normalize_email(value)
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("Invalid credentials")
        return value

class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    name: str
    role: RoleName

class AdminUserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=12, max_length=1024)
    role: RoleName
    @field_validator("email")
    @classmethod
    def normalized_email(cls, value: str) -> str: return normalize_email(value)

class AdminUserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    role: RoleName | None = None
    is_active: bool | None = None
