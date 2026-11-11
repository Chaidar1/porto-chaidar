"""
Schema Pydantic untuk endpoint Analytics.
"""
from pydantic import BaseModel


class PingRequest(BaseModel):
    """Request body untuk endpoint /ping — mencatat kunjungan halaman."""
    page: str = "home"


class DailyViewResponse(BaseModel):
    """Data kunjungan harian untuk satu hari."""
    date: str   # format "YYYY-MM-DD"
    count: int


class AnalyticsSummaryResponse(BaseModel):
    """Ringkasan statistik kunjungan untuk dashboard admin."""
    today: int
    total_7d: int
    total_30d: int
    daily_7d: list[DailyViewResponse]
    daily_30d: list[DailyViewResponse]

