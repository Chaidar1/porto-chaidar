from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class StatBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=80, examples=["TAHUN PENGALAMAN"])
    value: str = Field(..., min_length=1, max_length=30, examples=["04+"])
    order: int = Field(0, ge=0)


class StatCreate(StatBase):
    pass


class StatUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=80)
    value: Optional[str] = Field(None, min_length=1, max_length=30)
    order: Optional[int] = Field(None, ge=0)


class StatResponse(StatBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)