from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ResumeResponse(BaseModel):
    id: int
    file_url: str
    updated_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)