from sqlalchemy import Column, Integer, String
from app.database import Base

class HeroText(Base):
    __tablename__ = "hero_texts"

    id = Column(Integer, primary_key=True, index=True)
    availability = Column(String(50), nullable=False, default="OPEN TO WORK")
    location = Column(String(50), nullable=False, default="INDRAMAYU")
    work_type = Column(String(50), nullable=False, default="WFO / HYBRID")