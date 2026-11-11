from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date


class ExperienceBase(BaseModel):
    role: str = Field(..., min_length=2, max_length=150, examples=["Fullstack Developer"])
    company: str = Field(..., min_length=2, max_length=150, examples=["PT Contoh Teknologi"])
    description: Optional[str] = Field(None, examples=["Membangun REST API dengan FastAPI"])
    start_date: date = Field(..., examples=["2023-01-01"])
    end_date: Optional[date] = Field(None, examples=["2024-12-31"])
    is_current: int = Field(0, ge=0, le=1, examples=[0])
    order: int = Field(0, ge=0, examples=[1])


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    role: Optional[str] = Field(None, min_length=2, max_length=150)
    company: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[int] = Field(None, ge=0, le=1)
    order: Optional[int] = Field(None, ge=0)


class ExperienceResponse(ExperienceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)