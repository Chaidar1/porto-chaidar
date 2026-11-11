from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.experience import Experience
from app.schemas.experience import ExperienceCreate, ExperienceUpdate, ExperienceResponse

router = APIRouter()


@router.get("/", response_model=List[ExperienceResponse])
def list_experiences(db: Session = Depends(get_db)):
    """Publik: semua pengalaman, urut dari yang terbaru."""
    return db.query(Experience).order_by(
        Experience.is_current.desc(),
        Experience.start_date.desc(),
        Experience.order.asc(),
    ).all()


@router.get("/{experience_id}", response_model=ExperienceResponse)
def get_experience(experience_id: int, db: Session = Depends(get_db)):
    """Publik: detail satu pengalaman."""
    exp = db.query(Experience).filter(Experience.id == experience_id).first()
    if not exp:
        raise HTTPException(404, f"Experience dengan id {experience_id} tidak ditemukan")
    return exp


@router.post("/", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def create_experience(
    payload: ExperienceCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: buat pengalaman baru."""
    exp = Experience(**payload.model_dump())
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.put("/{experience_id}", response_model=ExperienceResponse)
def update_experience(
    experience_id: int,
    payload: ExperienceUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: update pengalaman."""
    exp = db.query(Experience).filter(Experience.id == experience_id).first()
    if not exp:
        raise HTTPException(404, f"Experience dengan id {experience_id} tidak ditemukan")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    experience_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: hapus pengalaman."""
    exp = db.query(Experience).filter(Experience.id == experience_id).first()
    if not exp:
        raise HTTPException(404, f"Experience dengan id {experience_id} tidak ditemukan")
    db.delete(exp)
    db.commit()
    return None