from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime


class ScreenerRequest(BaseModel):
    """Request model for screener job creation."""
    subset_limit: Optional[int] = None
    month_end: bool = True
    metrics: List[str] = ["Sharpe", "Sortino", "Up Capture", "Down Capture", "Rolling Returns"]
    timeframes: List[str] = ["1y", "3y", "5y"]


class JobStatus(BaseModel):
    """Job status response model."""
    job_id: str
    status: Literal["pending", "running", "completed", "failed"]
    progress: List[str]
    created_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class FundResult(BaseModel):
    """Individual fund result."""
    rank: int
    scheme_name: str
    category: str
    overall_score: float
    sharpe_score: Optional[float] = None
    sortino_score: Optional[float] = None
    up_cap_score: Optional[float] = None
    down_cap_score: Optional[float] = None
    rolling_score: Optional[float] = None
    fund_age: Optional[float] = None
    aum: Optional[str] = None
    expense_ratio: Optional[str] = None


class CategorySummary(BaseModel):
    """Category summary statistics."""
    category: str
    funds_screened: int
    rankable_funds: int
    not_rankable: int
    top_3: List[str]


class ScreenerResults(BaseModel):
    """Complete screener results."""
    categories: List[CategorySummary]
    top_funds: List[FundResult]
    all_rankable: Optional[List[FundResult]] = None
    generated_at: str
    filter_summary: str
