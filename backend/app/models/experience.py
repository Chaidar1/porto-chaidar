from sqlalchemy import Column, Integer, String, Text, Date
from app.database import Base

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    description = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date, nullable=True)
    is_current = Column(Integer, default=0)
    order = Column(Integer, default=0)