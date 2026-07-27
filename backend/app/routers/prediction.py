# Purpose of File: FastAPI HTTP API router defining endpoints for single student
#                   performance predictions, bulk batch predictions, and prediction history logs.
#
# Inputs        : SinglePredictionRequest or BatchPredictionRequest JSON payloads.
# Outputs       : PredictionResponse, BatchPredictionResponse, or PredictionHistoryResponse payloads.
# Execution Flow:
#                 1. Receives HTTP POST/GET requests at /api/v1/predict/*.
#                 2. Injects database session dependency (get_db).
#                 3. Delegates execution to PredictionService.
# ==============================================================================

from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.prediction import (
    SinglePredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionHistoryResponse
)
from app.services.prediction_service import PredictionService


router = APIRouter(prefix="/predict", tags=["Prediction API"])
prediction_service = PredictionService()


@router.post(
    "/single",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Individual Student Performance",
    description="Predicts academic performance category (Excellent, Good, Average, Poor) and confidence probabilities for a single student."
)
def predict_single_student(
    request: SinglePredictionRequest,
    db: Session = Depends(get_db)
) -> PredictionResponse:
    """
    HTTP POST /api/v1/predict/single
    


@router.post(
    "/batch",
    response_model=BatchPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Batch Student Performance",
    description="Predicts academic performance categories for a list of student records simultaneously."
)
def predict_batch_students(
    request: BatchPredictionRequest,
    db: Session = Depends(get_db)
) -> BatchPredictionResponse:
    """
    HTTP POST /api/v1/predict/batch
    """
    return prediction_service.predict_batch(request, db)


@router.get(
    "/history",
    response_model=PredictionHistoryResponse,
    summary="Get Prediction Audit History",
    description="Retrieves historical student prediction logs saved in the database."
)
def get_prediction_history(
    limit: int = Query(default=50, ge=1, le=500, description="Max history logs to fetch"),
    db: Session = Depends(get_db)
) -> PredictionHistoryResponse:
    """
    HTTP GET /api/v1/predict/history
    """
    return prediction_service.get_prediction_history(limit=limit, db=db)
