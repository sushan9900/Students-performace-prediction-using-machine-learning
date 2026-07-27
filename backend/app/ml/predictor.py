import os
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
import joblib
import numpy as np
import pandas as pd
from fastapi import HTTPException, status

from app.core.config import settings
from app.ml.preprocessor import DataPreprocessor, REVERSE_TARGET_MAPPING, CATEGORICAL_MAPPINGS


class StudentPerformancePredictor:
    """Loads trained model artifacts and runs inference for single or batch predictions."""

    def __init__(self):
        self._cached_model = None
        self._cached_model_path = None

    def load_model_artifact(self, model_path: Optional[str] = None) -> Any:
        """
        Loads a .joblib model from disk. Tries best_model.joblib first, then random_forest,
        then any path provided. Caches the loaded model to avoid redundant disk reads.
        """
        candidate_paths = []
        if model_path:
            candidate_paths.append(Path(model_path))
        candidate_paths.extend([
            settings.MODEL_DIR / "best_model.joblib",
            settings.MODEL_DIR / "random_forest_model.joblib",
            settings.MODEL_DIR / "student_model.pkl"
        ])

        unique_paths = []
        for p in candidate_paths:
            if p not in unique_paths and p.exists():
                unique_paths.append(p)

        if not unique_paths:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No trained model found. Please train models first via the /ml/train endpoint."
            )

        last_error = None
        for path in unique_paths:
            if self._cached_model is not None and self._cached_model_path == str(path):
                return self._cached_model

            try:
                model = joblib.load(path)
                self._cached_model = model
                self._cached_model_path = str(path)
                return model
            except Exception as e:
                last_error = e

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not load model file. Error: {str(last_error)}"
        )

    def predict_single(
        self,
        features_dict: Dict[str, Any],
        preprocessor: DataPreprocessor,
        model_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Predicts the performance category for a single student.
        Returns the predicted category string and per-class probability scores.
        """
        model = self.load_model_artifact(model_path)

        X_scaled = preprocessor.transform_single_input(features_dict)

        # pad or trim feature dimension if model was trained on different feature count
        if hasattr(model, "n_features_in_"):
            expected_n = model.n_features_in_
            current_n = X_scaled.shape[1]
            if current_n > expected_n:
                X_scaled = X_scaled[:, :expected_n]
            elif current_n < expected_n:
                pad = np.zeros((X_scaled.shape[0], expected_n - current_n))
                X_scaled = np.hstack([X_scaled, pad])

        pred_class_int = int(model.predict(X_scaled)[0])
        predicted_category = REVERSE_TARGET_MAPPING.get(pred_class_int, "Average")

        confidence_probs: Dict[str, float] = {}
        if hasattr(model, "predict_proba"):
            try:
                probs = model.predict_proba(X_scaled)[0]
                classes = getattr(model, "classes_", list(range(len(probs))))
                for cls_idx, prob in zip(classes, probs):
                    cat_name = REVERSE_TARGET_MAPPING.get(int(cls_idx), f"Class_{cls_idx}")
                    confidence_probs[cat_name] = round(float(prob), 4)
            except Exception:
                confidence_probs = {predicted_category: 1.0}
        else:
            confidence_probs = {predicted_category: 1.0}

        return {
            "predicted_category": predicted_category,
            "confidence_probabilities": confidence_probs,
            "numeric_class": pred_class_int
        }

    def predict_batch(
        self,
        df: pd.DataFrame,
        preprocessor: DataPreprocessor,
        model_path: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Runs predictions for a full dataframe of student records."""
        model = self.load_model_artifact(model_path)

        df_clean, _ = preprocessor.clean_dataset(df)
        X, _ = preprocessor.encode_features(df_clean)

        if preprocessor.is_fitted:
            X_scaled = preprocessor.scaler.transform(X)
        else:
            X_scaled = X.values

        if hasattr(model, "n_features_in_"):
            expected_n = model.n_features_in_
            current_n = X_scaled.shape[1]
            if current_n > expected_n:
                X_scaled = X_scaled[:, :expected_n]
            elif current_n < expected_n:
                pad = np.zeros((X_scaled.shape[0], expected_n - current_n))
                X_scaled = np.hstack([X_scaled, pad])

        predictions = model.predict(X_scaled)

        results = []
        for idx, pred in enumerate(predictions):
            category = REVERSE_TARGET_MAPPING.get(int(pred), "Average")
            results.append({
                "row_index": idx,
                "predicted_category": category
            })

        return results
