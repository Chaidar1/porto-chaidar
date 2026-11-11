from sqlalchemy import Column, Integer, String, Date
from sqlalchemy.sql import func
from app.database import Base


class PageView(Base):
    """
    Mencatat jumlah kunjungan per halaman per hari.
    Alih-alih menyimpan satu baris per kunjungan (bisa ratusan ribu),
    kita upsert counter harian → hemat storage & query cepat.
    """
    __tablename__ = "page_views"

    id = Column(Integer, primary_key=True, index=True)
    # tanggal kunjungan (UTC)
    date = Column(Date, nullable=False, index=True, server_default=func.current_date())
    # slug halaman: "home", "projects", dll.
    page = Column(String(60), nullable=False, index=True, default="home")
    # jumlah kunjungan pada hari itu untuk halaman tersebut
    count = Column(Integer, nullable=False, default=1)

