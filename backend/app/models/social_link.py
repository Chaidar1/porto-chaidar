from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class SocialLink(Base):
    __tablename__ = "social_links"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50), unique=True, nullable=False) # 'github', 'linkedin', 'email'
    url = Column(String(255), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())