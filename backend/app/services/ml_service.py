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
    
    Why it exists:
    --------------
    Encapsulates machine learning orchestration workflows, isolating model training,
    evaluation metric storage, and database persistence from FastAPI route handlers.
    """

    def __init__(self):
        self.dataset_service = DatasetService()
        self.trainer = ModelTrainer()

    def train_models(self, request: TrainModelRequest, db: Session) -> ModelComparisonResponse:
        """
        Executes model training for selected algorithms, compares performance, and saves results.
        
        Why it exists:
        --------------
        Orchestrates full ML training pipeline: Data Prep -> 6 Classifiers Training -> Evaluation -> DB Persistence.
        
        Inputs : request (TrainModelRequest): Training parameters.
                 db (Session): Database session.
        Outputs: ModelComparisonResponse: Comparison results and winning classifier.
        """
        # 1. Fetch target dataset
        if request.dataset_id:
            dataset = self.dataset_service.get_dataset_by_id(request.dataset_id, db)
        else:
            dataset = self.dataset_service.get_active_dataset(db)

        # 2. Read DataFrame
        df = read_csv_to_dataframe(dataset.file_path)

        # 3. Preprocess and Split Data
        preprocessor = DataPreprocessor()
        X_train, X_test, y_train, y_test, feature_names = preprocessor.prepare_train_test_split(
            df=df,
            target_col=request.target_column,
            test_size=request.test_size,
            random_state=request.random_state
        )

        # 4. Train and Compare ML Algorithms
        results, best_key = self.trainer.train_and_compare_all(
            X_train=X_train,
            X_test=X_test,
            y_train=y_train,
            y_test=y_test,
            feature_names=feature_names,
            selected_keys=request.selected_algorithms,
            cv_folds=request.cv_folds
        )

        # 5. Clear previous model flags in DB if re-training
        db.query(MLModelArtifact).update({MLModelArtifact.is_best_model: False})
        db.commit()

        # 6. Save Model Records to Database
        db_models_list: List[MLModelArtifact] = []

        for key, res in results.items():
            metrics = res["metrics"]
            is_best = (key == best_key)

            db_model = MLModelArtifact(
                model_name=res["model_name"],
                model_type=key,
                is_best_model=is_best,
                file_path=res["file_path"],
                accuracy=metrics["accuracy"],
                precision=metrics["precision"],
                recall=metrics["recall"],
                f1_score=metrics["f1_score"],
                cv_score_mean=metrics["cv_score_mean"],
                cv_score_std=metrics["cv_score_std"],
                confusion_matrix_json=metrics["confusion_matrix"],
                classification_report_json=metrics["classification_report"],
                feature_importance_json=metrics["feature_importance"],
                hyperparameters_json=res["hyperparameters"]
            )

            db.add(db_model)
            db.commit()
            db.refresh(db_model)
            db_models_list.append(db_model)

        # 7. Update Dashboard Aggregated Stats
        winning_model = results[best_key]
        dashboard_stat = db.query(DashboardSummary).first()
        if not dashboard_stat:
            dashboard_stat = DashboardSummary()
            db.add(dashboard_stat)

        dashboard_stat.total_models_trained += len(results)
        dashboard_stat.best_performing_model = winning_model["model_name"]
        dashboard_stat.best_model_accuracy = winning_model["metrics"]["accuracy"]
        db.commit()

        # 8. Format Pydantic Response Payload
        formatted_models = [
            ModelDetailResponse(
                id=m.id,
                model_name=m.model_name,
                model_type=m.model_type,
                is_best_model=m.is_best_model,
                file_path=m.file_path,
                accuracy=m.accuracy,
                precision=m.precision,
                recall=m.recall,
                f1_score=m.f1_score,
                cv_score_mean=m.cv_score_mean,
                cv_score_std=m.cv_score_std,
                confusion_matrix=m.confusion_matrix_json,
                classification_report=m.classification_report_json,
                feature_importance=m.feature_importance_json,
                hyperparameters=m.hyperparameters_json,
                trained_at=m.trained_at.isoformat()
            )
            for m in db_models_list
        ]

        return ModelComparisonResponse(
            total_models_trained=len(db_models_list),
            best_model_name=winning_model["model_name"],
            best_model_type=best_key,
            best_accuracy=winning_model["metrics"]["accuracy"],
            models=formatted_models
        )

    def get_all_models(self, db: Session) -> List[ModelDetailResponse]:
        """Retrieves all trained models saved in database."""
        models = db.query(MLModelArtifact).order_by(MLModelArtifact.accuracy.desc()).all()
        return [
            ModelDetailResponse(
                id=m.id,
                model_name=m.model_name,
                model_type=m.model_type,
                is_best_model=m.is_best_model,
                file_path=m.file_path,
                accuracy=m.accuracy,
                precision=m.precision,
                recall=m.recall,
                f1_score=m.f1_score,
                cv_score_mean=m.cv_score_mean,
                cv_score_std=m.cv_score_std,
                confusion_matrix=m.confusion_matrix_json,
                classification_report=m.classification_report_json,
                feature_importance=m.feature_importance_json,
                hyperparameters=m.hyperparameters_json,
                trained_at=m.trained_at.isoformat()
            )
            for m in models
        ]

    def get_best_model(self, db: Session) -> ModelDetailResponse:
        """Retrieves the highest-performing model artifact from database."""
        model = db.query(MLModelArtifact).filter(MLModelArtifact.is_best_model == True).first()
        if not model:
            # Fallback to model with highest accuracy score
            model = db.query(MLModelArtifact).order_by(MLModelArtifact.accuracy.desc()).first()

        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No trained machine learning model found. Please train models first."
            )

        return ModelDetailResponse(
            id=model.id,
            model_name=model.model_name,
            model_type=model.model_type,
            is_best_model=model.is_best_model,
            file_path=model.file_path,
            accuracy=model.accuracy,
            precision=model.precision,
            recall=model.recall,
            f1_score=model.f1_score,
            cv_score_mean=model.cv_score_mean,
            cv_score_std=model.cv_score_std,
            confusion_matrix=model.confusion_matrix_json,
            classification_report=model.classification_report_json,
            feature_importance=model.feature_importance_json,
            hyperparameters=model.hyperparameters_json,
            trained_at=model.trained_at.isoformat()
        )
