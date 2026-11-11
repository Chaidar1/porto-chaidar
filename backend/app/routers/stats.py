from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.stat import Stat
from app.schemas.stat import StatCreate, StatUpdate, StatResponse

router = APIRouter()

# Default 4 stats — otomatis diisi kalau tabel kosong
DEFAULT_STATS = [
    {"label": "TAHUN PENGALAMAN", "value": "04+", "order": 1},
    {"label": "PROJECT SELESAI", "value": "28", "order": 2},
    {"label": "KLIEN & PARTNER", "value": "12", "order": 3},
    {"label": "KOMITMEN DELIVERY", "value": "100%", "order": 4},
]


def _ensure_seeded(db: Session) -> None:
    if db.query(Stat).count() > 0:
        return
    for item in DEFAULT_STATS:
        db.add(Stat(**item))
    db.commit()


@router.get("/", response_model=List[StatResponse])
def list_stats(db: Session = Depends(get_db)):
    """Publik: semua stats, urut berdasarkan order."""
    _ensure_seeded(db)
    return db.query(Stat).order_by(Stat.order.asc(), Stat.id.asc()).all()


@router.put("/{stat_id}", response_model=StatResponse)
def update_stat(
    stat_id: int,
    payload: StatUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: update label/value/order satu stat."""
    stat = db.query(Stat).filter(Stat.id == stat_id).first()
    if not stat:
        raise HTTPException(404, f"Stat dengan id {stat_id} tidak ditemukan")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(stat, field, value)
    db.commit()
    db.refresh(stat)
    return stat


@router.post("/", response_model=StatResponse, status_code=status.HTTP_201_CREATED)
def create_stat(
    payload: StatCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: tambah stat baru (opsional, kalau ingin lebih dari 4)."""
    stat = Stat(**payload.model_dump())
    db.add(stat)
    db.commit()
    db.refresh(stat)
    return stat


@router.delete("/{stat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stat(
    stat_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: hapus stat."""
    stat = db.query(Stat).filter(Stat.id == stat_id).first()
    if not stat:
        raise HTTPException(404, f"Stat dengan id {stat_id} tidak ditemukan")
    db.delete(stat)
    db.commit()
    return None