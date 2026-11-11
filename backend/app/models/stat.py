from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Stat(Base):
    __tablename__ = "stats"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(80), nullable=False)
    value = Column(String(30), nullable=False)
    order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())