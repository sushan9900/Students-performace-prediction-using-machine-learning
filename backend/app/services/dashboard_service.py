# Purpose of File: Business logic layer for generating aggregated dashboard metrics
#                   including student statistics, performance distribution, attendance
#                   vs. grade correlations, study hour impact analysis, prediction summaries,
#                   and model comparison metrics.
#
# Inputs        : SQLAlchemy database session.
# Outputs       : Comprehensive dictionary containing all dashboard visualization payloads.
# Execution Flow:
#                 1. Queries total dataset uploads, trained ML models, and prediction logs.
#                 2. Calculates student averages for Attendance, Study Hours, and Past Marks.
#                 3. Generates performance distribution counts (Excellent, Good, Average, Poor).
#                 4. Computes correlation scatter data for Attendance vs Grade and Study Hours vs Grade.
# ==============================================================================

from typing import Dict, List, Any
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.database.models import DatasetModel, MLModelArtifact, PredictionRecord, DashboardSummary
from app.services.dataset_service import DatasetService
from app.services.ml_service import MLService
from app.utils.file_handler import read_csv_to_dataframe


class DashboardService:
    """
    Dashboard Service Class.
    

    def __init__(self):
        self.dataset_service = DatasetService()
        self.ml_service = MLService()

    def get_dashboard_statistics(self, db: Session) -> Dict[str, Any]:
        """
        Calculates complete system analytics for dashboard visualizations.
