"""Jalankan sekali: python seed_admin.py"""
from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

ADMIN_USERNAME = "chaidar"
ADMIN_EMAIL = "chaidar@example.com"
ADMIN_PASSWORD = "admin12345"  # GANTI setelah login pertama!

db = SessionLocal()
try:
    existing = db.query(User).filter(User.username == ADMIN_USERNAME).first()
    if existing:
        existing.is_admin = True
        existing.hashed_password = hash_password(ADMIN_PASSWORD)
        db.commit()
        print(f"✅ User '{ADMIN_USERNAME}' sudah ada — di-upgrade jadi admin & password di-reset.")
    else:
        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            is_active=True,
            is_admin=True,
        )
        db.add(admin)
        db.commit()
        print(f"✅ Admin '{ADMIN_USERNAME}' dibuat. Password: {ADMIN_PASSWORD}")
finally:
    db.close()