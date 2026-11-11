from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class HeroProfileResponse(BaseModel):
    id: int
    image_url: str
    position_x: float
    position_y: float
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class HeroPositionUpdate(BaseModel):
    position_x: float = Field(..., ge=0, le=100)
    position_y: float = Field(..., ge=0, le=100)