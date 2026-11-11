from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user, get_current_admin

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Registrasi user. Hanya untuk setup awal — produksi bisa dimatikan."""
    existing = db.query(User).filter(
        or_(User.username == payload.username, User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(409, "Username atau email sudah terdaftar")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login dengan JSON {username, password} — cocok untuk frontend React."""
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
        )
    if not user.is_active:
        raise HTTPException(403, "Akun dinonaktifkan")

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/token", response_model=Token, include_in_schema=False)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Endpoint OAuth2 form (dipakai tombol Authorize di Swagger)."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "Username atau password salah")
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Info user yang sedang login."""
    return current_user