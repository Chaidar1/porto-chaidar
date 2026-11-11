from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Background(Base):
    __tablename__ = "backgrounds"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(30), nullable=False, index=True)  # education | certification | organization
    title = Column(String(200), nullable=False)
    subtitle = Column(String(200), nullable=True)  # misal "Teknik Informatika · 2017 — 2021"
    description = Column(Text, nullable=True)
    link_url = Column(String(255), nullable=True)  # misal link verifikasi sertifikat
    link_label = Column(String(80), nullable=True)  # misal "VERIFIKASI ↗"
    order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    photos = relationship(
        "BackgroundPhoto",
        back_populates="background",
        cascade="all, delete-orphan",
        order_by="BackgroundPhoto.order",
    )