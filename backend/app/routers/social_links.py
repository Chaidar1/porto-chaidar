from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.social_link import SocialLink
from app.schemas.social_link import SocialLinkResponse, SocialLinkUpdate, SocialLinkCreate

router = APIRouter()

# Seed default jika kosong
@router.get("/", response_model=List[SocialLinkResponse])
def get_socials(db: Session = Depends(get_db)):
    links = db.query(SocialLink).all()
    if not links:
        defaults = [
            SocialLink(platform="github", url="https://github.com/chaidar"),
            SocialLink(platform="linkedin", url="https://linkedin.com/in/chaidar"),
            SocialLink(platform="email", url="mailto:hello@example.com")
        ]
        db.add_all(defaults)
        db.commit()
        links = db.query(SocialLink).all()
    return links

@router.put("/{platform}", response_model=SocialLinkResponse)
def update_social(platform: str, payload: SocialLinkUpdate, db: Session = Depends(get_db), _: object = Depends(get_current_admin)):
    link = db.query(SocialLink).filter(SocialLink.platform == platform).first()
    if not link:
        raise HTTPException(404, "Platform tidak ditemukan")
    link.url = payload.url
    db.commit()
    db.refresh(link)
    return link