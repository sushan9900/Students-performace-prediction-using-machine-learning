# Purpose of File: Business logic layer for running real-time single student predictions,
#                   batch CSV student predictions, persisting prediction logs in database
#                   table ('predictions'), and querying historical prediction logs.
#
# Inputs        : SinglePredictionRequest or BatchPredictionRequest, database sessions.
# Outputs       : PredictionResponse, BatchPredictionResponse, PredictionHistoryResponse objects.
# Execution Flow:
#                 1. Retrieves target model file path from database or MLService.
#                 2. Fits/uses DataPreprocessor to scale input features.
#                 3. Invokes StudentPerformancePredictor inference engine.
#                 4. Creates persistent PredictionRecord logs in database.
#                 5. Increments prediction counter in DashboardSummary.
# ==============================================================================

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.database.models import PredictionRecord, DashboardSummary, MLModelArtifact
from app.schemas.prediction import (
    SinglePredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionHistoryResponse
)
from app.ml.preprocessor import DataPreprocessor
from app.ml.predictor import StudentPerformancePredictor
from app.services.ml_service import MLService
from app.services.dataset_service import DatasetService
from app.utils.file_handler import read_csv_to_dataframe


class PredictionService:
    """
    Prediction Service Class.
    

    def __init__(self):
        self.predictor = StudentPerformancePredictor()
        self.ml_service = MLService()
        self.dataset_service = DatasetService()

    def predict_single_student(
        self, 
        request: SinglePredictionRequest, 
        db: Session
    ) -> PredictionResponse:
        """
        Executes real-time performance prediction for an individual student.
