from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_current_admin
from app.core.limiter import limiter
from app.database import get_db
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter()


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_message(
    request: Request,
    payload: MessageCreate,
    db: Session = Depends(get_db),
):
    """Publik: pengunjung kirim pesan kontak."""
    msg = Message(**payload.model_dump())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/", response_model=List[MessageResponse])
def list_messages(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: lihat semua pesan. Bisa filter ?unread_only=true."""
    q = db.query(Message)
    if unread_only:
        q = q.filter(Message.is_read == False)  # noqa: E712
    return q.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{message_id}", response_model=MessageResponse)
def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: detail satu pesan."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(404, f"Message dengan id {message_id} tidak ditemukan")
    return msg


@router.patch("/{message_id}/read", response_model=MessageResponse)
def mark_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: tandai pesan sudah dibaca."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(404, f"Message dengan id {message_id} tidak ditemukan")
    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """Admin: hapus pesan."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(404, f"Message dengan id {message_id} tidak ditemukan")
    db.delete(msg)
    db.commit()
    return None