from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BackgroundPhoto(Base):
    __tablename__ = "background_photos"

    id = Column(Integer, primary_key=True, index=True)
    background_id = Column(
        Integer,
        ForeignKey("backgrounds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url = Column(String(255), nullable=False)
    alt = Column(String(255), nullable=True)
    caption = Column(String(255), nullable=True)
    credit = Column(String(255), nullable=True)
    order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    background = relationship("Background", back_populates="photos")