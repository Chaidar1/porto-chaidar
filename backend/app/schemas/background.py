from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional, List
from datetime import datetime


CategoryType = Literal["education", "certification", "organization"]


class BackgroundPhotoBase(BaseModel):
    image_url: str = Field(..., max_length=255, examples=["/static/uploads/album-xxx.jpg"])
    alt: Optional[str] = Field(None, max_length=255, examples=["Dokumentasi acara"])
    caption: Optional[str] = Field(None, max_length=255, examples=["Hari kelulusan"])
    credit: Optional[str] = Field(None, max_length=255, examples=["Foto oleh Mardanafin"])
    order: int = Field(0, ge=0)


class BackgroundPhotoUpdate(BaseModel):
    alt: Optional[str] = Field(None, max_length=255)
    caption: Optional[str] = Field(None, max_length=255)
    credit: Optional[str] = Field(None, max_length=255)
    order: Optional[int] = Field(None, ge=0)


class BackgroundPhotoResponse(BackgroundPhotoBase):
    id: int
    background_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BackgroundBase(BaseModel):
    category: CategoryType = Field(..., examples=["education"])
    title: str = Field(..., min_length=2, max_length=200, examples=["Universitas Teknologi Indonesia"])
    subtitle: Optional[str] = Field(None, max_length=200, examples=["Teknik Informatika · 2017 — 2021"])
    description: Optional[str] = Field(None, examples=["IPK 3.78 · Fokus rekayasa perangkat lunak."])
    link_url: Optional[str] = Field(None, max_length=255, examples=["https://aws.amazon.com/verification"])
    link_label: Optional[str] = Field(None, max_length=80, examples=["VERIFIKASI ↗"])
    order: int = Field(0, ge=0)


class BackgroundCreate(BackgroundBase):
    pass


class BackgroundUpdate(BaseModel):
    category: Optional[CategoryType] = None
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    link_url: Optional[str] = Field(None, max_length=255)
    link_label: Optional[str] = Field(None, max_length=80)
    order: Optional[int] = Field(None, ge=0)


class BackgroundResponse(BackgroundBase):
    id: int
    photos: List[BackgroundPhotoResponse] = []
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)