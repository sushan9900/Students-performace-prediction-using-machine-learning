# Purpose of File: Pytest automated test suite for testing Machine Learning pipeline
#                   modules (DataPreprocessor, ModelTrainer, ModelEvaluator, Predictor).
#
# Execution Command: pytest backend/tests/test_ml.py
# ==============================================================================

import pytest
import numpy as np
import pandas as pd
from app.ml.preprocessor import DataPreprocessor
from app.ml.model_trainer import ModelTrainer
from app.ml.evaluator import ModelEvaluator
from app.ml.predictor import StudentPerformancePredictor


@pytest.fixture
def sample_student_dataframe():
    """Generates a sample student DataFrame fixture for ML testing."""
    return pd.DataFrame({
        "Gender": ["Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male"],
        "Age": [20, 21, 19, 22, 20, 19, 21, 20, 22, 18],
        "Attendance": [92.5, 85.0, 65.0, 78.0, 95.0, 55.0, 88.0, 72.0, 91.0, 60.0],
        "Study Hours": [22.5, 18.0, 8.5, 14.0, 28.0, 6.0, 20.0, 12.0, 24.0, 7.0],
        "Previous Semester Marks": [88.0, 76.5, 52.0, 68.0, 94.0, 45.0, 82.0, 62.0, 89.0, 48.0],
        "Assignment Score": [91.0, 80.0, 58.0, 72.0, 96.0, 48.0, 85.0, 65.0, 90.0, 52.0],
        "Internal Assessment": [89.5, 78.0, 55.0, 70.0, 95.0, 50.0, 84.0, 64.0, 91.0, 50.0],
        "Class Participation": [90.0, 82.0, 60.0, 75.0, 92.0, 52.0, 86.0, 68.0, 88.0, 55.0],
        "Internet Access": ["Yes", "Yes", "No", "Yes", "Yes", "No", "Yes", "Yes", "Yes", "No"],
        "Parental Education": ["Bachelor", "High School", "Associate", "Master", "Doctorate", "High School", "Bachelor", "Associate", "Master", "High School"],
        "Family Income": ["Medium", "Low", "Low", "High", "High", "Low", "Medium", "Medium", "High", "Low"],
        "Extra Curricular Activities": ["Yes", "No", "No", "Yes", "Yes", "No", "Yes", "No", "Yes", "No"],
        "PerformanceCategory": ["Excellent", "Good", "Poor", "Average", "Excellent", "Poor", "Good", "Average", "Excellent", "Poor"]
    })


def test_preprocessor_clean_dataset(sample_student_dataframe):
    """Tests missing value imputation and deduplication in DataPreprocessor."""
    preprocessor = DataPreprocessor()
    df_clean, logs = preprocessor.clean_dataset(sample_student_dataframe)
    
    assert len(df_clean) == 10
    assert logs["initial_rows"] == 10
    assert logs["duplicates_removed"] == 0


def test_preprocessor_train_test_split(sample_student_dataframe):
    """Tests feature encoding, scaling, and train/test splitting."""
    preprocessor = DataPreprocessor()
    X_train, X_test, y_train, y_test, feature_names = preprocessor.prepare_train_test_split(
        sample_student_dataframe, test_size=0.2, random_state=42
    )

    assert X_train.shape[0] == 8
    assert X_test.shape[0] == 2
    assert len(feature_names) >= 6
    assert preprocessor.is_fitted is True


def test_model_trainer_training(sample_student_dataframe):
    """Tests training and comparison across classifiers in ModelTrainer."""
    preprocessor = DataPreprocessor()
    X_train, X_test, y_train, y_test, feature_names = preprocessor.prepare_train_test_split(
        sample_student_dataframe
    )

    trainer = ModelTrainer()
    results, best_key = trainer.train_and_compare_all(
        X_train, X_test, y_train, y_test, feature_names, selected_keys=["random_forest", "decision_tree"]
    )

    assert "random_forest" in results
    assert "decision_tree" in results
    assert best_key in ["random_forest", "decision_tree"]
    assert results[best_key]["is_best"] is True


def test_predictor_single_inference(sample_student_dataframe):
    """Tests real-time single student vector transformation and inference."""
    preprocessor = DataPreprocessor()
    preprocessor.prepare_train_test_split(sample_student_dataframe)

    predictor = StudentPerformancePredictor()
    student_features = {
        "gender": "Female",
        "age": 20,
        "attendance": 92.0,
        "study_hours": 22.0,
        "previous_semester_marks": 88.0,
        "assignment_score": 90.0,
        "internal_assessment": 89.0,
        "class_participation": 90.0,
        "internet_access": "Yes",
        "parental_education": "Bachelor",
        "family_income": "Medium",
        "extra_curricular_activities": "Yes"
    }

    result = predictor.predict_single(student_features, preprocessor)
    assert result["predicted_category"] in ["Excellent", "Good", "Average", "Poor"]
    assert "confidence_probabilities" in result
