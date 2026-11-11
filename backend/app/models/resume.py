from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    file_url = Column(String(255), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())