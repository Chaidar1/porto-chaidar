from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ARRAY
from sqlalchemy.sql import func
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True)
    category = Column(String(30), nullable=False, default="fullstack", index=True)  # ← baru
    description = Column(Text)
    tech_stack = Column(ARRAY(String), default=[])
    image_url = Column(String(255))
    demo_url = Column(String(255))
    repo_url = Column(String(255))
    is_featured = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())