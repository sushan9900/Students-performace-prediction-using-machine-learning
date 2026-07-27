# Purpose of File: Defines Pydantic V2 schemas for ML model training configurations,
#                   evaluation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix,
#                   Feature Importance), cross-validation, and multi-model comparison responses.
#
# Inputs        : Frontend HTTP requests for initiating model training or comparing models.
# Outputs       : Validated model training requests and rich evaluation metric payloads.
# Execution Flow:
#                 1. Validates hyperparameter requests (e.g. test_size, cv_folds).
#                 2. Formats complex machine learning evaluation outputs into JSON response schemas.
# ==============================================================================

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class TrainModelRequest(BaseModel):
    """
    Schema for initiating Machine Learning model training.
    


class ConfusionMatrixSchema(BaseModel):
    """
    Schema for Confusion Matrix chart visualization data.
    


class LearningCurveSchema(BaseModel):
    """
    Schema for Learning Curve visualization.
    


class ModelEvaluationMetrics(BaseModel):
    """
    Schema representing full performance evaluation metrics for a single algorithm.
    


class ModelDetailResponse(BaseModel):
    """
    Schema for detailed ML Model response payload.
    

    model_config = ConfigDict(from_attributes=True)


class ModelComparisonResponse(BaseModel):
    """
    Schema for multi-model automated comparison results.
    
