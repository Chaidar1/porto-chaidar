from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, examples=["chaidar"])
    email: EmailStr = Field(..., examples=["chaidar@example.com"])


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72, examples=["rahasia123"])


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str = Field(..., examples=["chaidar"])
    password: str = Field(..., examples=["rahasia123"])