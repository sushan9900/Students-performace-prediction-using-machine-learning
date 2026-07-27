# Purpose of File: Business logic layer for orchestrating Machine Learning model
#                   training pipelines, model comparison, evaluation persistence,
#                   and retrieving trained classifier details from the database.
#
# Inputs        : TrainModelRequest objects, database sessions, and model IDs.
# Outputs       : ModelComparisonResponse, ModelDetailResponse objects, and database records.
# Execution Flow:
#                 1. Loads dataset CSV via DatasetService.
#                 2. Executes DataPreprocessor to obtain scaled train/test splits.
#                 3. Invokes ModelTrainer to train and compare all 6 classifiers.
#                 4. Persists MLModelArtifact entities and updates DashboardSummary table in database.
# ==============================================================================

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.database.models import MLModelArtifact, DashboardSummary
from app.schemas.ml_model import (
    TrainModelRequest,
    ModelDetailResponse,
    ModelComparisonResponse,
    ModelEvaluationMetrics
)
from app.services.dataset_service import DatasetService
from app.utils.file_handler import read_csv_to_dataframe
from app.ml.preprocessor import DataPreprocessor
from app.ml.model_trainer import ModelTrainer


class MLService:
    """
    ML Service Class.
    

    def __init__(self):
        self.dataset_service = DatasetService()
        self.trainer = ModelTrainer()

    def train_models(self, request: TrainModelRequest, db: Session) -> ModelComparisonResponse:
        """
        Executes model training for selected algorithms, compares performance, and saves results.
