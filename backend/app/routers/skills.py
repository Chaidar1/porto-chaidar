from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillUpdate, SkillResponse

router = APIRouter()


@router.get("/", response_model=List[SkillResponse])
def list_skills(
    skip: int = 0,
    limit: int = 200,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    """Publik: ambil semua skill. Bisa filter ?category=frontend."""
    q = db.query(Skill)
    if category:
        q = q.filter(Skill.category == category)
    return q.order_by(Skill.order.asc(), Skill.id.asc()).offset(skip).limit(limit).all()


@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    """Publik: detail satu skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(404, f"Skill dengan id {skill_id} tidak ditemukan")
    return skill


@router.post("/", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    payload: SkillCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: buat skill baru."""
    skill = Skill(**payload.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: int,
    payload: SkillUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: update skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(404, f"Skill dengan id {skill_id} tidak ditemukan")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(skill, field, value)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: hapus skill."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(404, f"Skill dengan id {skill_id} tidak ditemukan")
    db.delete(skill)
    db.commit()
    return None