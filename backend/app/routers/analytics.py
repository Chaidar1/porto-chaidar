"""
Router Analytics — melacak kunjungan halaman portfolio.

Endpoint publik:
  POST /api/analytics/ping  — catat satu kunjungan (rate-limited 20/minute per IP)

Endpoint admin:
  GET  /api/analytics/views?days=7  — data harian untuk dashboard chart
"""
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.core.limiter import limiter
from app.database import get_db
from app.models.page_view import PageView
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    DailyViewResponse,
    PingRequest,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Endpoint Publik
# ---------------------------------------------------------------------------

@router.post("/ping", status_code=204)
@limiter.limit("20/minute")
def ping(
    request: Request,
    payload: PingRequest,
    db: Session = Depends(get_db),
):
    """
    Publik: frontend memanggil ini saat pengunjung membuka halaman.
    Upsert counter harian agar tidak terjadi ledakan data.
    Rate-limited 20 request/menit per IP untuk mencegah abuse.
    """
    today = date.today()
    page_slug = payload.page[:60]  # batasi panjang slug

    existing = (
        db.query(PageView)
        .filter(PageView.date == today, PageView.page == page_slug)
        .first()
    )

    if existing:
        existing.count += 1
    else:
        db.add(PageView(date=today, page=page_slug, count=1))

    db.commit()
    # HTTP 204 — No Content


# ---------------------------------------------------------------------------
# Endpoint Admin
# ---------------------------------------------------------------------------

@router.get("/views", response_model=AnalyticsSummaryResponse)
def get_views(
    days: int = 7,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_admin),
):
    """
    Admin: kembalikan ringkasan kunjungan harian.
    Query param ?days=7 (default) atau ?days=30.
    Halaman yang dilacak: semua page (dijumlah per hari).
    """
    # Batasi nilai days agar query tetap aman
    days = max(1, min(days, 90))

    today = date.today()
    start_7d = today - timedelta(days=6)
    start_30d = today - timedelta(days=29)

    # Ambil semua baris dalam 30 hari terakhir sekaligus
    rows = (
        db.query(PageView.date, PageView.count)
        .filter(PageView.date >= start_30d)
        .all()
    )

    # Agregasi per hari (semua halaman dijumlah)
    agg: dict[date, int] = {}
    for row in rows:
        agg[row.date] = agg.get(row.date, 0) + row.count

    def build_series(start: date, end: date) -> list[DailyViewResponse]:
        """Buat daftar berurut dari start sampai end, isi 0 jika tidak ada data."""
        series = []
        cur = start
        while cur <= end:
            series.append(
                DailyViewResponse(date=str(cur), count=agg.get(cur, 0))
            )
            cur += timedelta(days=1)
        return series

    daily_7d = build_series(start_7d, today)
    daily_30d = build_series(start_30d, today)

    total_7d = sum(d.count for d in daily_7d)
    total_30d = sum(d.count for d in daily_30d)
    today_count = agg.get(today, 0)

    return AnalyticsSummaryResponse(
        today=today_count,
        total_7d=total_7d,
        total_30d=total_30d,
        daily_7d=daily_7d,
        daily_30d=daily_30d,
    )

