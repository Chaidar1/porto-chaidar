from pydantic import BaseModel, ConfigDict

class HeroTextResponse(BaseModel):
    id: int
    availability: str
    location: str
    work_type: str
    model_config = ConfigDict(from_attributes=True)

class HeroTextUpdate(BaseModel):
    availability: str
    location: str
    work_type: str