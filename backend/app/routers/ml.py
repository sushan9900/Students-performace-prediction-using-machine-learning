# Purpose of File: FastAPI HTTP API router defining endpoints for training machine learning
#                   classifiers, comparing algorithm performance, retrieving model artifacts,
#                   and rendering model evaluation metrics.
#
# Inputs        : TrainModelRequest JSON payloads or model IDs.
# Outputs       : ModelComparisonResponse and ModelDetailResponse JSON structures.
# Execution Flow:
#                 1. Receives HTTP requests at /api/v1/ml/*.
#                 2. Injects database session dependency (get_db).
#                 3. Invokes MLService to execute model training or fetch model metrics.
# ==============================================================================

from typing import List
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.ml_model import (
    TrainModelRequest,
    ModelDetailResponse,
    ModelComparisonResponse
)
from app.services.ml_service import MLService


router = APIRouter(prefix="/ml", tags=["Machine Learning API"])
ml_service = MLService()


@router.post(
    "/train",
    response_model=ModelComparisonResponse,
    status_code=status.HTTP_200_OK,
    summary="Train & Compare Machine Learning Models",
    description="Trains 6 classification models (Random Forest, Decision Tree, Logistic Regression, SVM, KNN, Naive Bayes), evaluates performance, auto-selects the winner, and saves models."
)
def train_models(
    request: TrainModelRequest,
    db: Session = Depends(get_db)
) -> ModelComparisonResponse:
    """
    HTTP POST /api/v1/ml/train
    
    Why it exists:
    --------------
    Triggers automated model training, evaluation, and multi-algorithm comparison.
    
    Inputs : request (TrainModelRequest): Training hyperparameter request body.
             db (Session): Database session.
    Outputs: ModelComparisonResponse: Evaluation metrics for all algorithms.
    """
    return ml_service.train_models(request, db)


@router.get(
    "/models",
    response_model=List[ModelDetailResponse],
    summary="List All Trained Models",
    description="Retrieves a list of all trained machine learning model artifacts saved in the database."
)
def get_all_models(
    db: Session = Depends(get_db)
) -> List[ModelDetailResponse]:
    """
    HTTP GET /api/v1/ml/models
    """
    return ml_service.get_all_models(db)


@router.get(
    "/best-model",
    response_model=ModelDetailResponse,
    summary="Get Highest Performing Model",
    description="Retrieves the single auto-selected highest-performing machine learning model artifact."
)
def get_best_model(
    db: Session = Depends(get_db)
) -> ModelDetailResponse:
    """
    HTTP GET /api/v1/ml/best-model
    """
    return ml_service.get_best_model(db)
