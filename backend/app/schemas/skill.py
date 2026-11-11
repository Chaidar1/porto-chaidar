from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=80, examples=["React"])
    category: str = Field(..., max_length=50, examples=["frontend"])
    proficiency: float = Field(80.0, ge=0, le=100, examples=[90])
    icon: Optional[str] = Field(None, examples=["/static/uploads/react.svg"])
    order: int = Field(0, ge=0, examples=[1])


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    category: Optional[str] = Field(None, max_length=50)
    proficiency: Optional[float] = Field(None, ge=0, le=100)
    icon: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)


class SkillResponse(SkillBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)