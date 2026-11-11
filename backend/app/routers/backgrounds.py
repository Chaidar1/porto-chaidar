import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, UploadFile, status,
)
from sqlalchemy.orm import Session

from app.config import settings
from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.background import Background
from app.models.background_photo import BackgroundPhoto
from app.schemas.background import (
    BackgroundCreate,
    BackgroundUpdate,
    BackgroundResponse,
    BackgroundPhotoUpdate,
    BackgroundPhotoResponse,
)

router = APIRouter()

VALID_CATEGORIES = {"education", "certification", "organization"}
ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_SIZE = 5 * 1024 * 1024


def _delete_file(url: str) -> None:
    if not url:
        return
    prefix = "/static/uploads/"
    if not url.startswith(prefix):
        return
    filepath = Path(settings.UPLOAD_DIR) / url[len(prefix):]
    if filepath.exists():
        try:
            filepath.unlink()
        except OSError:
            pass


def _get_background_or_404(db: Session, bg_id: int) -> Background:
    bg = db.query(Background).filter(Background.id == bg_id).first()
    if not bg:
        raise HTTPException(404, f"Background dengan id {bg_id} tidak ditemukan")
    return bg


def _get_photo_or_404(db: Session, photo_id: int) -> BackgroundPhoto:
    photo = db.query(BackgroundPhoto).filter(BackgroundPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(404, f"Foto dengan id {photo_id} tidak ditemukan")
    return photo


# ─── Background CRUD ─────────────────────────────────────────────

@router.get("/", response_model=List[BackgroundResponse])
def list_backgrounds(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Publik: semua background + array photos. Bisa filter ?category=education."""
    q = db.query(Background)
    if category:
        if category not in VALID_CATEGORIES:
            raise HTTPException(422, f"Kategori tidak valid: {category}")
        q = q.filter(Background.category == category)
    return q.order_by(
        Background.category.asc(), Background.order.asc(), Background.id.asc()
    ).all()


@router.get("/{item_id}", response_model=BackgroundResponse)
def get_background(item_id: int, db: Session = Depends(get_db)):
    return _get_background_or_404(db, item_id)


@router.post("/", response_model=BackgroundResponse, status_code=status.HTTP_201_CREATED)
def create_background(
    payload: BackgroundCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    item = Background(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=BackgroundResponse)
def update_background(
    item_id: int,
    payload: BackgroundUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    item = _get_background_or_404(db, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_background(
    item_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    item = _get_background_or_404(db, item_id)
    # Hapus semua file foto dulu, baru hapus record (cascade)
    for photo in item.photos:
        _delete_file(photo.image_url)
    db.delete(item)
    db.commit()
    return None


# ─── Photo endpoints ──────────────────────────────────────────────

@router.get("/{bg_id}/photos", response_model=List[BackgroundPhotoResponse])
def list_photos(bg_id: int, db: Session = Depends(get_db)):
    """Publik: semua foto satu background, urut berdasarkan order."""
    _get_background_or_404(db, bg_id)
    return (
        db.query(BackgroundPhoto)
        .filter(BackgroundPhoto.background_id == bg_id)
        .order_by(BackgroundPhoto.order.asc(), BackgroundPhoto.id.asc())
        .all()
    )


@router.post(
    "/{bg_id}/photos",
    response_model=BackgroundPhotoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_photo(
    bg_id: int,
    file: UploadFile = File(...),
    alt: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    credit: Optional[str] = Form(None),
    order: int = Form(0),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: upload satu foto ke album background."""
    _get_background_or_404(db, bg_id)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Tipe file tidak didukung: {file.content_type}. "
            f"Gunakan JPG/PNG/WebP/GIF.",
        )
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            "Ukuran file maksimal 5 MB",
        )

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"album-{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(content)

    photo = BackgroundPhoto(
        background_id=bg_id,
        image_url=f"/static/uploads/{filename}",
        alt=alt,
        caption=caption,
        credit=credit,
        order=order,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.put(
    "/photos/{photo_id}",
    response_model=BackgroundPhotoResponse,
)
def update_photo(
    photo_id: int,
    payload: BackgroundPhotoUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: update caption/credit/alt/order satu foto."""
    photo = _get_photo_or_404(db, photo_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(photo, field, value)
    db.commit()
    db.refresh(photo)
    return photo


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: hapus satu foto (record + file fisik)."""
    photo = _get_photo_or_404(db, photo_id)
    _delete_file(photo.image_url)
    db.delete(photo)
    db.commit()
    return None