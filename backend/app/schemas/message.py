from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from datetime import datetime


class MessageBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Budi Santoso"])
    email: EmailStr = Field(..., examples=["budi@example.com"])
    subject: Optional[str] = Field(None, max_length=200, examples=["Tertarik kolaborasi"])
    message: str = Field(..., min_length=5, examples=["Halo, saya ingin berdiskusi soal proyek..."])


class MessageCreate(MessageBase):
    """Untuk publik kirim pesan — is_read otomatis false."""
    pass


class MessageResponse(MessageBase):
    id: int
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)