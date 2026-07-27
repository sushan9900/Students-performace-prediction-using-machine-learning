# Purpose of File: Defines database tables using SQLAlchemy ORM for storing
#                   dataset metadata, trained ML models with evaluation metrics,
#                   individual student prediction logs, and dashboard statistics.
#
# Inputs        : SQLAlchemy Base from app.database.session.
# Outputs       : ORM Model classes mapping Python objects to database tables.
# Execution Flow:
#                 1. Inherits from Base class.
#                 2. Maps table columns, data types, constraints, and timestamps.
#                 3. Serializes complex metrics (Confusion Matrix, Feature Importances)
#                    into JSON structures for flexible UI reporting.
# ==============================================================================

from datetime import datetime, timezone
import json
from typing import Any, Dict
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON
)
from app.database.session import Base


def get_utc_now() -> datetime:
    """Returns current UTC timestamp for record creation."""
    return datetime.now(timezone.utc)


class DatasetModel(Base):
    """
    Table: datasets
    

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    columns_list = Column(JSON, nullable=False)  # List of column names in the CSV
    file_size_bytes = Column(Integer, nullable=False, default=0)
    uploaded_at = Column(DateTime, default=get_utc_now, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Converts model instance attributes to dictionary format."""
        return {
            "id": self.id,
            "filename": self.filename,
            "file_path": self.file_path,
            "row_count": self.row_count,
            "column_count": self.column_count,
            "columns_list": self.columns_list,
            "file_size_bytes": self.file_size_bytes,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "is_active": self.is_active,
        }


class MLModelArtifact(Base):
    """
    Table: ml_models
    

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String(100), nullable=False)  # Display Name (e.g., 'Random Forest (Primary)')
    model_type = Column(String(50), nullable=False)   # Key (e.g., 'random_forest')
    is_best_model = Column(Boolean, default=False, nullable=False)
    file_path = Column(String(512), nullable=False)   # Path to saved .joblib model artifact

    # Core Metric Scores
    accuracy = Column(Float, nullable=False, default=0.0)
    precision = Column(Float, nullable=False, default=0.0)
    recall = Column(Float, nullable=False, default=0.0)
    f1_score = Column(Float, nullable=False, default=0.0)
    cv_score_mean = Column(Float, nullable=False, default=0.0)
    cv_score_std = Column(Float, nullable=False, default=0.0)

    # Serialized Matrix & Graph Data (Stored as JSON objects)
    confusion_matrix_json = Column(JSON, nullable=True)     # 2D array representation
    classification_report_json = Column(JSON, nullable=True) # Detailed class-wise metrics
    feature_importance_json = Column(JSON, nullable=True)    # Dictionary of {feature: score}
    hyperparameters_json = Column(JSON, nullable=True)       # Model hyperparameter dict
    
    trained_at = Column(DateTime, default=get_utc_now, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Converts model instance attributes to dictionary format."""
        return {
            "id": self.id,
            "model_name": self.model_name,
            "model_type": self.model_type,
            "is_best_model": self.is_best_model,
            "file_path": self.file_path,
            "accuracy": round(self.accuracy, 4),
            "precision": round(self.precision, 4),
            "recall": round(self.recall, 4),
            "f1_score": round(self.f1_score, 4),
            "cv_score_mean": round(self.cv_score_mean, 4),
            "cv_score_std": round(self.cv_score_std, 4),
            "confusion_matrix": self.confusion_matrix_json,
            "classification_report": self.classification_report_json,
            "feature_importance": self.feature_importance_json,
            "hyperparameters": self.hyperparameters_json,
            "trained_at": self.trained_at.isoformat() if self.trained_at else None,
        }


class PredictionRecord(Base):
    """
    Table: predictions
    

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_identifier = Column(String(100), nullable=True, default="Anonymous Student")
    
    # Store complete input feature map (e.g. attendance, study hours, previous marks)
    input_features_json = Column(JSON, nullable=False)
    
    # Machine Learning Output Category (Excellent, Good, Average, Poor)
    predicted_category = Column(String(50), nullable=False)
    
    # Prediction probability distribution map (e.g. {"Excellent": 0.85, "Good": 0.15})
    confidence_probabilities_json = Column(JSON, nullable=True)
    
    model_used = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Converts model instance attributes to dictionary format."""
        return {
            "id": self.id,
            "student_identifier": self.student_identifier,
            "input_features": self.input_features_json,
            "predicted_category": self.predicted_category,
            "confidence_probabilities": self.confidence_probabilities_json,
            "model_used": self.model_used,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DashboardSummary(Base):
    """
    Table: dashboard_stats
    

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    total_datasets = Column(Integer, default=0, nullable=False)
    total_models_trained = Column(Integer, default=0, nullable=False)
    total_predictions_made = Column(Integer, default=0, nullable=False)
    best_performing_model = Column(String(100), default="None", nullable=False)
    best_model_accuracy = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)
