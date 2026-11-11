from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SocialLinkResponse(BaseModel):
    id: int
    platform: str
    url: str
    model_config = ConfigDict(from_attributes=True)

class SocialLinkUpdate(BaseModel):
    url: str

class SocialLinkCreate(BaseModel):
    platform: str
    url: str