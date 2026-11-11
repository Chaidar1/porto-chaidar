from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Normalisasi URL database untuk kompatibilitas cloud (Render, Railway, Supabase, Heroku)
# yang sering memberikan URL berawalan "postgres://" sedangkan SQLAlchemy 2.0 mewajibkan "postgresql://"
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(_db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()