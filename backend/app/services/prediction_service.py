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
    
    Why it exists:
    --------------
    Encapsulates student inference workflow logic, insulating API route handlers
    from low-level feature vector transformations and database transaction management.
    """

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
        
        Why it exists:
        --------------
        Powers the single-student form prediction endpoint, saving the input parameters
        and classification results to history log table.
        
        Inputs : request (SinglePredictionRequest): Input features dictionary.
                 db (Session): Database session.
        Outputs: PredictionResponse: Predicted category and confidence scores.
        """
        # 1. Determine Model Path
        model_path = None
        model_name = "Best Model (Auto Selected)"

        if request.model_id:
            model_db = db.query(MLModelArtifact).filter(MLModelArtifact.id == request.model_id).first()
            if model_db:
                model_path = model_db.file_path
                model_name = model_db.model_name
        else:
            try:
                best_model_db = self.ml_service.get_best_model(db)
                model_path = best_model_db.file_path
                model_name = best_model_db.model_name
            except Exception:
                model_path = None

        # 2. Instantiate DataPreprocessor (loads pre-fitted scaler.pkl from disk)
        preprocessor = DataPreprocessor()

        # 3. Execute Model Inference
        features_dict = request.features.model_dump()
        result = self.predictor.predict_single(
            features_dict=features_dict,
            preprocessor=preprocessor,
            model_path=model_path
        )

        # 4. Create Database Record
        db_prediction = PredictionRecord(
            student_identifier=request.student_identifier or "Anonymous Student",
            input_features_json=features_dict,
            predicted_category=result["predicted_category"],
            confidence_probabilities_json=result["confidence_probabilities"],
            model_used=model_name
        )

        db.add(db_prediction)

        # 5. Increment Dashboard Total Predictions Count
        dashboard_stat = db.query(DashboardSummary).first()
        if not dashboard_stat:
            dashboard_stat = DashboardSummary(total_predictions_made=0)
            db.add(dashboard_stat)
        if dashboard_stat.total_predictions_made is None:
            dashboard_stat.total_predictions_made = 0
        dashboard_stat.total_predictions_made += 1

        db.commit()
        db.refresh(db_prediction)

        return PredictionResponse(
            id=db_prediction.id,
            student_identifier=db_prediction.student_identifier,
            input_features=db_prediction.input_features_json,
            predicted_category=db_prediction.predicted_category,
            confidence_probabilities=db_prediction.confidence_probabilities_json,
            model_used=db_prediction.model_used,
            created_at=db_prediction.created_at.isoformat()
        )

    def predict_batch(
        self, 
        request: BatchPredictionRequest, 
        db: Session
    ) -> BatchPredictionResponse:
        """
        Executes prediction for multiple student feature instances simultaneously.
        
        Inputs : request (BatchPredictionRequest): List of student feature objects.
                 db (Session): Database session.
        Outputs: BatchPredictionResponse: Category counts and individual responses.
        """
        responses: List[PredictionResponse] = []
        category_counts: Dict[str, int] = {"Excellent": 0, "Good": 0, "Average": 0, "Poor": 0}

        for idx, student_input in enumerate(request.students):
            single_req = SinglePredictionRequest(
                student_identifier=f"Student #{idx + 1}",
                features=student_input,
                model_id=request.model_id
            )
            res = self.predict_single_student(single_req, db)
            responses.append(res)
            
            cat = res.predicted_category
            category_counts[cat] = category_counts.get(cat, 0) + 1

        return BatchPredictionResponse(
            total_students=len(responses),
            category_counts=category_counts,
            predictions=responses
        )

    def get_prediction_history(self, limit: int = 50, db: Session = None) -> PredictionHistoryResponse:
        """
        Retrieves prediction history logs sorted by creation timestamp descending.
        
        Inputs : limit (int): Max records to retrieve.
                 db (Session): Database session.
        Outputs: PredictionHistoryResponse: Historical prediction list.
        """
        records = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).limit(limit).all()
        
        formatted_list = [
            PredictionResponse(
                id=r.id,
                student_identifier=r.student_identifier or "Student",
                input_features=r.input_features_json,
                predicted_category=r.predicted_category,
                confidence_probabilities=r.confidence_probabilities_json or {},
                model_used=r.model_used,
                created_at=r.created_at.isoformat()
            )
            for r in records
        ]

        return PredictionHistoryResponse(
            total_records=len(formatted_list),
            predictions=formatted_list
        )
