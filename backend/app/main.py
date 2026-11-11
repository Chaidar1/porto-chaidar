from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.limiter import limiter
from app.database import Base, engine
import app.models  # noqa: F401 — daftarkan semua model
from app.routers import (
    auth,
    projects,
    skills,
    experiences,
    messages,
    upload,
    hero,
    backgrounds,
    stats,
    social_links,
    resume,
    hero_texts,
    analytics,
)

# Inisialisasi tabel dasar jika belum ada (skema lanjutan dikelola via Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Porto Chaidar API", version="1.0.0")

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Terlalu banyak permintaan pesan. Harap tunggu sebentar sebelum mengirim pesan lagi."},
    )


cors_origins = [orig.strip() for orig in settings.CORS_ORIGINS.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(skills.router, prefix="/api/skills", tags=["Skills"])
app.include_router(experiences.router, prefix="/api/experiences", tags=["Experiences"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(hero.router, prefix="/api/hero", tags=["Hero"])
app.include_router(hero_texts.router, prefix="/api/hero-texts", tags=["Hero Texts"])
app.include_router(backgrounds.router, prefix="/api/backgrounds", tags=["Backgrounds"])
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])
app.include_router(social_links.router, prefix="/api/socials", tags=["Socials"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "Porto Chaidar API is running 🚀"}