from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base


class HeroProfile(Base):
    __tablename__ = "hero_profile"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(255), nullable=False)
    position_x = Column(Float, nullable=False, default=50.0)  # 0-100 (%)
    position_y = Column(Float, nullable=False, default=50.0)  # 0-100 (%)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())