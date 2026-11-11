from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.hero_text import HeroText
from app.schemas.hero_text import HeroTextResponse, HeroTextUpdate

router = APIRouter()

@router.get("/", response_model=HeroTextResponse)
def get_hero_text(db: Session = Depends(get_db)):
    hero = db.query(HeroText).first()
    if not hero:
        hero = HeroText() # Menggunakan default dari model
        db.add(hero)
        db.commit()
        db.refresh(hero)
    return hero

@router.put("/", response_model=HeroTextResponse)
def update_hero_text(payload: HeroTextUpdate, db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    hero = db.query(HeroText).first()
    if not hero:
        hero = HeroText(**payload.model_dump())
        db.add(hero)
    else:
        hero.availability = payload.availability
        hero.location = payload.location
        hero.work_type = payload.work_type
    db.commit()
    db.refresh(hero)
    return hero