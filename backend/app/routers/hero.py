import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.hero_profile import HeroProfile
from app.schemas.hero_profile import HeroProfileResponse, HeroPositionUpdate

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_SIZE = 5 * 1024 * 1024


def _get_or_none(db: Session) -> Optional[HeroProfile]:
    return db.query(HeroProfile).order_by(HeroProfile.id.asc()).first()


def _delete_file(url: str) -> None:
    if not url:
        return
    prefix = "/static/uploads/"
    if not url.startswith(prefix):
        return
    filename = url[len(prefix):]
    filepath = Path(settings.UPLOAD_DIR) / filename
    if filepath.exists():
        try:
            filepath.unlink()
        except OSError:
            pass


@router.get("/", response_model=Optional[HeroProfileResponse])
def get_hero_profile(db: Session = Depends(get_db)):
    """Publik: ambil foto hero + posisi."""
    return _get_or_none(db)


@router.post(
    "/",
    response_model=HeroProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_hero_photo(
    file: UploadFile = File(...),
    position_x: float = Form(50.0),
    position_y: float = Form(50.0),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: upload/ganti foto hero. Posisi opsional (default 50/50)."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipe file tidak didukung: {file.content_type}.",
        )
    if not (0 <= position_x <= 100) or not (0 <= position_y <= 100):
        raise HTTPException(422, "position_x dan position_y harus 0-100")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ukuran file maksimal 5 MB",
        )

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"hero-{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(content)
    new_url = f"/static/uploads/{filename}"

    existing = _get_or_none(db)
    if existing:
        _delete_file(existing.image_url)
        existing.image_url = new_url
        existing.position_x = position_x
        existing.position_y = position_y
        db.commit()
        db.refresh(existing)
        return existing

    hero = HeroProfile(
        image_url=new_url,
        position_x=position_x,
        position_y=position_y,
    )
    db.add(hero)
    db.commit()
    db.refresh(hero)
    return hero


@router.patch("/position", response_model=HeroProfileResponse)
def update_hero_position(
    payload: HeroPositionUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: update posisi foto tanpa upload ulang."""
    hero = _get_or_none(db)
    if not hero:
        raise HTTPException(404, "Foto hero belum ada")
    hero.position_x = payload.position_x
    hero.position_y = payload.position_y
    db.commit()
    db.refresh(hero)
    return hero


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_hero_photo(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    hero = _get_or_none(db)
    if not hero:
        raise HTTPException(404, "Foto hero belum ada")
    _delete_file(hero.image_url)
    db.delete(hero)
    db.commit()
    return None