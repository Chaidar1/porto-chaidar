import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.core.dependencies import get_current_admin
from app.database import get_db
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse

router = APIRouter()
ALLOWED_TYPES = {
    "application/pdf": ".pdf",
}
MAX_SIZE = 10 * 1024 * 1024 # 10 MB

@router.get("/", response_model=ResumeResponse | None)
def get_resume(db: Session = Depends(get_db)):
    return db.query(Resume).order_by(Resume.id.desc()).first()

@router.post("/", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "File harus berupa PDF")
    
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Ukuran maksimal 10 MB")

    # Hapus file lama
    old = db.query(Resume).first()
    if old and old.file_url.startswith("/static/uploads/"):
        old_path = Path(settings.UPLOAD_DIR) / old.file_url.split("/")[-1]
        if old_path.exists():
            old_path.unlink()
        db.delete(old)
        db.commit()

    ext = ".pdf"
    filename = f"cv-{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(content)

    resume = Resume(file_url=f"/static/uploads/{filename}")
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin)
):
    old = db.query(Resume).first()
    if not old:
        raise HTTPException(404, "CV belum ada")
    if old.file_url.startswith("/static/uploads/"):
        old_path = Path(settings.UPLOAD_DIR) / old.file_url.split("/")[-1]
        if old_path.exists():
            old_path.unlink()
    db.delete(old)
    db.commit()