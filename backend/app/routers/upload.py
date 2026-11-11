import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.config import settings
from app.core.dependencies import get_current_admin

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    _: object = Depends(get_current_admin),
):
    """Admin: upload gambar, kembalikan URL publik."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipe file tidak didukung: {file.content_type}. "
                   f"Gunakan JPG/PNG/WebP/GIF/SVG.",
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ukuran file maksimal 5 MB",
        )

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = upload_dir / filename
    filepath.write_bytes(content)

    return {
        "url": f"/static/uploads/{filename}",
        "filename": filename,
        "size": len(content),
        "content_type": file.content_type,
    }