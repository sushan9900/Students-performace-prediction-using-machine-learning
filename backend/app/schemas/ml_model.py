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
    
    Why it exists:
    --------------
    Allows users to select target prediction column, test/train split ratio,
    cross-validation folds, and specific machine learning algorithms to train.
    """
    dataset_id: Optional[int] = Field(default=None, description="Optional ID of dataset. If None, uses active dataset.")
    target_column: str = Field(default="PerformanceCategory", description="Target classification target column")
    test_size: float = Field(default=0.2, ge=0.1, le=0.5, description="Test split fraction (0.1 to 0.5)")
    random_state: int = Field(default=42, description="Random seed for reproducible train/test splits")
    cv_folds: int = Field(default=5, ge=2, le=10, description="Cross-validation fold count (2 to 10)")
    selected_algorithms: List[str] = Field(
        default=[
            "random_forest",
            "decision_tree",
            "logistic_regression",
            "svm",
            "knn",
            "naive_bayes"
        ],
        description="List of ML algorithm keys to train and compare"
    )


class ConfusionMatrixSchema(BaseModel):
    """
    Schema for Confusion Matrix chart visualization data.
    
    Why it exists:
    --------------
    Provides class names, 2D matrix counts, and percentage breakdowns for heatmaps.
    """
    labels: List[str] = Field(..., description="Target class labels e.g. ['Excellent', 'Good', 'Average', 'Poor']")
    matrix: List[List[int]] = Field(..., description="2D matrix array [[TP, FP], [FN, TN]]")


class LearningCurveSchema(BaseModel):
    """
    Schema for Learning Curve visualization.
    
    Why it exists:
    --------------
    Tracks training and validation accuracy scores across varying training set sizes
    to diagnose over-fitting or under-fitting.
    """
    train_sizes: List[int] = Field(..., description="Training sample size increments")
    train_scores_mean: List[float] = Field(..., description="Mean training accuracy per step")
    test_scores_mean: List[float] = Field(..., description="Mean validation accuracy per step")


class ModelEvaluationMetrics(BaseModel):
    """
    Schema representing full performance evaluation metrics for a single algorithm.
    
    Why it exists:
    --------------
    Encapsulates all standard ML metrics required for final year evaluation presentation.
    """
    accuracy: float = Field(..., description="Overall model accuracy (0.0 to 1.0)")
    precision: float = Field(..., description="Weighted precision score")
    recall: float = Field(..., description="Weighted recall score")
    f1_score: float = Field(..., description="Weighted F1-score")
    cv_score_mean: float = Field(..., description="Mean Cross-Validation accuracy")
    cv_score_std: float = Field(..., description="Standard Deviation of CV accuracy")
    confusion_matrix: ConfusionMatrixSchema = Field(..., description="Confusion Matrix data")
    classification_report: Dict[str, Any] = Field(..., description="Detailed classification report per class")
    feature_importance: Dict[str, float] = Field(..., description="Feature importance scores dictionary")
    learning_curve: Optional[LearningCurveSchema] = Field(default=None, description="Learning curve points")


class ModelDetailResponse(BaseModel):
    """
    Schema for detailed ML Model response payload.
    
    Why it exists:
    --------------
    Returns complete information about a trained model stored in the database.
    """
    id: int = Field(..., description="Model record ID")
    model_name: str = Field(..., description="Human-readable model name e.g. 'Random Forest (Primary)'")
    model_type: str = Field(..., description="Model key identifier e.g. 'random_forest'")
    is_best_model: bool = Field(..., description="True if auto-selected as highest performing algorithm")
    file_path: str = Field(..., description="Path to .joblib model file")
    accuracy: float = Field(..., description="Accuracy score")
    precision: float = Field(..., description="Precision score")
    recall: float = Field(..., description="Recall score")
    f1_score: float = Field(..., description="F1 score")
    cv_score_mean: float = Field(..., description="CV score mean")
    cv_score_std: float = Field(..., description="CV score std")
    confusion_matrix: Optional[Dict[str, Any]] = Field(default=None, description="Confusion matrix dictionary")
    classification_report: Optional[Dict[str, Any]] = Field(default=None, description="Classification report dict")
    feature_importance: Optional[Dict[str, float]] = Field(default=None, description="Feature importances")
    hyperparameters: Optional[Dict[str, Any]] = Field(default=None, description="Algorithm hyperparameters")
    trained_at: str = Field(..., description="Timestamp when model was trained")

    model_config = ConfigDict(from_attributes=True)


class ModelComparisonResponse(BaseModel):
    """
    Schema for multi-model automated comparison results.
    
    Why it exists:
    --------------
    Compares Random Forest, Decision Tree, Logistic Regression, SVM, KNN, and Naive Bayes
    and identifies the highest-performing model automatically.
    """
    total_models_trained: int = Field(..., description="Number of models evaluated")
    best_model_name: str = Field(..., description="Name of the winning model")
    best_model_type: str = Field(..., description="Type key of the winning model")
    best_accuracy: float = Field(..., description="Accuracy of the top performing model")
    models: List[ModelDetailResponse] = Field(..., description="List of all evaluated model metrics")
