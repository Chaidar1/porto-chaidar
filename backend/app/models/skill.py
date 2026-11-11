from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), nullable=False)
    category = Column(String(50))  # frontend, backend, database, tools
    proficiency = Column(Float, default=80.0)  # 0-100
    icon = Column(String(255))
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())