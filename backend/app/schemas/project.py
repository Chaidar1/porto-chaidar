from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Literal
from datetime import datetime


CategoryType = Literal["fullstack", "frontend", "backend"]


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150, examples=["Porto Chaidar"])
    slug: str = Field(..., min_length=3, max_length=150, examples=["porto-chaidar"])
    category: CategoryType = Field("fullstack", examples=["fullstack"])
    description: Optional[str] = Field(None, examples=["Website portofolio fullstack"])
    tech_stack: List[str] = Field(default_factory=list, examples=[["React", "FastAPI"]])
    image_url: Optional[str] = Field(None, examples=["/static/uploads/project-1.png"])
    demo_url: Optional[str] = Field(None, examples=["https://porto.chaidar.dev"])
    repo_url: Optional[str] = Field(None, examples=["https://github.com/chaidar/porto"])
    is_featured: bool = False
    is_published: bool = True


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    slug: Optional[str] = Field(None, min_length=3, max_length=150)
    category: Optional[CategoryType] = None
    description: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    image_url: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)