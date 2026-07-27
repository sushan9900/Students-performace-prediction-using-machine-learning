# Purpose of File: FastAPI HTTP API router defining endpoints for retrieving aggregated
#                   dashboard statistics, student performance distributions, attendance
#                   vs. grade correlations, and study hour impact analytics.
#
# Inputs        : HTTP GET requests to /api/v1/dashboard/stats.
# Outputs       : Aggregated JSON statistics payload for React dashboard charts.
# Execution Flow:
#                 1. Receives GET request at /api/v1/dashboard/stats.
#                 2. Injects database session dependency (get_db).
#                 3. Invokes DashboardService to gather system metric summaries.
# ==============================================================================

from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.dashboard_service import DashboardService


router = APIRouter(prefix="/dashboard", tags=["Dashboard Statistics API"])
dashboard_service = DashboardService()


@router.get(
    "/stats",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get Aggregated Dashboard Statistics",
    description="Returns summary cards, student averages, performance category distribution, model comparison metrics, and attendance/study hour trend data."
)
def get_dashboard_stats(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    HTTP GET /api/v1/dashboard/stats
    
