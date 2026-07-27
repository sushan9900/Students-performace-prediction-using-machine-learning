# Purpose of File: Standalone CLI script for evaluating saved .joblib model artifacts.
#                   Computes and displays Confusion Matrix 2D grids, Classification Reports
#                   per grade category, 5-Fold Cross Validation scores, and Feature Importances.
#
# Inputs        : Command-line arguments '--model' and '--dataset'.
# Outputs       : Formatted diagnostic prints in the terminal.
# Execution Flow:
#                 1. Loads trained model file using Joblib.
#                 2. Preprocesses dataset CSV and executes model.predict().
#                 3. Prints Confusion Matrix, Classification Report, 5-Fold CV metrics, and Feature Importances.
# ==============================================================================

import argparse
import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = BASE_DIR / "models" / "best_model.joblib"
DEFAULT_DATASET_PATH = BASE_DIR / "dataset" / "student_performance_dataset.csv"

CLASS_LABELS = ["Poor", "Average", "Good", "Excellent"]


def main():
    parser = argparse.ArgumentParser(description="Evaluate Trained ML Model Artifact")
    parser.add_argument("--model", type=str, default=str(DEFAULT_MODEL_PATH), help="Path to .joblib model")
    parser.add_argument("--dataset", type=str, default=str(DEFAULT_DATASET_PATH), help="Path to CSV dataset")
    args = parser.parse_args()

    model_path = Path(args.model)
    dataset_path = Path(args.dataset)

    if not model_path.exists():
        print(f"❌ Error: Model artifact not found at: {model_path}")
        print("💡 Hint: Run 'python machine_learning/train_standalone.py' first to train models.")
        sys.exit(1)

    print(f"📦 Loading model artifact from: {model_path}")
    model = joblib.load(model_path)

    print(f"📥 Loading evaluation dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)

    # Simple numeric encoding
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype("category").cat.codes

    target_col = df.columns[-1]
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    y_pred = model.predict(X_test_scaled)

    # Compute Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring="accuracy")

    print("\n" + "=" * 65)
    print(f"📊 MODEL EVALUATION DIAGNOSTICS: {model.__class__.__name__}")
    print("=" * 65)
    print(f"• Accuracy           : {acc * 100:.2f}%")
    print(f"• Weighted Precision : {prec * 100:.2f}%")
    print(f"• Weighted Recall    : {rec * 100:.2f}%")
    print(f"• Weighted F1-Score  : {f1 * 100:.2f}%")
    print(f"• 5-Fold CV Mean Acc : {cv_scores.mean() * 100:.2f}% (±{cv_scores.std() * 100:.2f}%)")

    print("\n" + "-" * 65)
    print("📋 CONFUSION MATRIX:")
    print("-" * 65)
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    print("\n" + "-" * 65)
    print("📈 CLASSIFICATION REPORT:")
    print("-" * 65)
    print(classification_report(y_test, y_pred, zero_division=0))

    # Feature Importance
    if hasattr(model, "feature_importances_"):
        print("-" * 65)
        print("⭐ FEATURE IMPORTANCES:")
        print("-" * 65)
        for col_name, score in zip(X.columns, model.feature_importances_):
            print(f"• {col_name:<30} : {score:.4f}")
    print("=" * 65)


if __name__ == "__main__":
    main()
