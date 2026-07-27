import os
from pathlib import Path
from typing import Dict, Tuple, Any, List, Optional
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB

try:
    import xgboost as xgb
except ImportError:
    xgb = None

try:
    import lightgbm as lgb
except ImportError:
    lgb = None

from app.core.config import settings
from app.ml.evaluator import ModelEvaluator


class ModelTrainer:
    """
    Handles training, evaluating, and saving all supported ML classifiers.
    After training, automatically marks the best performing model for deployment.
    """

    SUPPORTED_ALGORITHMS = {
        "random_forest": {
            "name": "Random Forest (Primary)",
            "class": RandomForestClassifier,
            "params": {"n_estimators": 100, "max_depth": 10, "random_state": 42}
        },
        "decision_tree": {
            "name": "Decision Tree",
            "class": DecisionTreeClassifier,
            "params": {"max_depth": 6, "random_state": 42}
        },
        "logistic_regression": {
            "name": "Logistic Regression",
            "class": LogisticRegression,
            "params": {"max_iter": 1000, "C": 1.0, "random_state": 42}
        },
        "svm": {
            "name": "Support Vector Machine",
            "class": SVC,
            "params": {"kernel": "rbf", "C": 1.0, "probability": True, "random_state": 42}
        },
        "knn": {
            "name": "K-Nearest Neighbors",
            "class": KNeighborsClassifier,
            "params": {"n_neighbors": 5, "weights": "uniform"}
        },
        "naive_bayes": {
            "name": "Naive Bayes",
            "class": GaussianNB,
            "params": {}
        }
    }

    if lgb is not None:
        SUPPORTED_ALGORITHMS["lightgbm"] = {
            "name": "LightGBM Classifier",
            "class": lgb.LGBMClassifier,
            "params": {"random_state": 42, "verbose": -1}
        }

    if xgb is not None:
        SUPPORTED_ALGORITHMS["xgboost"] = {
            "name": "XGBoost Classifier",
            "class": xgb.XGBClassifier,
            "params": {"eval_metric": "mlogloss", "random_state": 42}
        }

    def __init__(self):
        self.evaluator = ModelEvaluator()

    def train_single_algorithm(
        self,
        algorithm_key: str,
        X_train: np.ndarray,
        y_train: np.ndarray
    ) -> Any:
        """Instantiates and fits a single classifier. Falls back to random_forest if key is unknown."""
        if algorithm_key not in self.SUPPORTED_ALGORITHMS:
            algorithm_key = "random_forest"

        algo_info = self.SUPPORTED_ALGORITHMS[algorithm_key]
        model = algo_info["class"](**algo_info["params"])
        model.fit(X_train, y_train)

        return model

    def train_and_compare_all(
        self,
        X_train: np.ndarray,
        X_test: np.ndarray,
        y_train: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str],
        selected_keys: Optional[List[str]] = None,
        cv_folds: int = 5
    ) -> Tuple[Dict[str, Dict[str, Any]], str]:
        """
        Trains all selected algorithms, evaluates each, and picks the winner by accuracy.
        Saves each trained model as a .joblib file and also saves the best model separately.
        """
        if not selected_keys:
            selected_keys = list(self.SUPPORTED_ALGORITHMS.keys())

        results: Dict[str, Dict[str, Any]] = {}
        best_model_key = ""
        highest_accuracy = -1.0

        for key in selected_keys:
            if key not in self.SUPPORTED_ALGORITHMS:
                continue

            display_name = self.SUPPORTED_ALGORITHMS[key]["name"]

            model = self.train_single_algorithm(key, X_train, y_train)

            metrics = self.evaluator.evaluate(
                model=model,
                X_train=X_train,
                X_test=X_test,
                y_train=y_train,
                y_test=y_test,
                feature_names=feature_names,
                cv_folds=cv_folds
            )

            file_name = f"{key}_model.joblib"
            file_path = settings.MODEL_DIR / file_name
            joblib.dump(model, file_path)

            current_accuracy = metrics["accuracy"]

            results[key] = {
                "model_name": display_name,
                "model_type": key,
                "model_object": model,
                "file_path": file_path.as_posix(),
                "metrics": metrics,
                "hyperparameters": self.SUPPORTED_ALGORITHMS[key]["params"],
                "is_best": False
            }

            if current_accuracy > highest_accuracy:
                highest_accuracy = current_accuracy
                best_model_key = key

        if best_model_key in results:
            results[best_model_key]["is_best"] = True
            best_path = settings.MODEL_DIR / "best_model.joblib"
            joblib.dump(results[best_model_key]["model_object"], best_path)

        return results, best_model_key
