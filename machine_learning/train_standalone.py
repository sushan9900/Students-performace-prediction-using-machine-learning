
import os
import sys
import argparse
from pathlib import Path

# Phase 4: Import Libraries
import pandas as pd
import numpy as np

import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_curve, auc
)

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

import joblib

# Paths setup
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATASET_PATH = BASE_DIR / "dataset" / "student_performance_dataset.csv"
REPORTS_DIR = BASE_DIR / "reports"
MODELS_DIR = BASE_DIR / "models"


def run_pipeline(dataset_path: Path):
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # --------------------------------------------------------------------------
    # Phase 5: Load Dataset
    # --------------------------------------------------------------------------
    if not dataset_path.exists():
        # Fallback check
        alt_path = BASE_DIR / "dataset" / "student_performance.csv"
        if alt_path.exists():
            dataset_path = alt_path
        else:
            print(f"❌ Error: Dataset file not found at: {dataset_path}")
            sys.exit(1)

    print(f"[Phase 5] Loading Dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)

    # --------------------------------------------------------------------------
    # Phase 6: Explore Dataset
    # --------------------------------------------------------------------------
    print("\n[Phase 6] Exploring Dataset:")
    print("--- df.head() ---")
    print(df.head(3))
    print("\n--- df.tail() ---")
    print(df.tail(3))
    print(f"\n--- df.shape: {df.shape} ---")
    print(f"--- df.columns: {list(df.columns)} ---")
    print("\n--- df.info() ---")
    df.info()
    print("\n--- df.describe() ---")
    print(df.describe().T)

    # --------------------------------------------------------------------------
    # Phase 7: Check Missing Values
    # --------------------------------------------------------------------------
    print("\n[Phase 7] Checking & Handling Missing Values:")
    missing = df.isnull().sum()
    print(missing[missing > 0] if missing.sum() > 0 else "Zero missing values detected.")

    for col in df.columns:
        if df[col].isnull().sum() > 0:
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col].fillna(df[col].mean(), inplace=True)
            else:
                df[col].fillna(df[col].mode()[0], inplace=True)

    # --------------------------------------------------------------------------
    # Phase 8: Remove Duplicates
    # --------------------------------------------------------------------------
    initial_len = len(df)
    df.drop_duplicates(inplace=True)
    print(f"[Phase 8] Duplicates removed: {initial_len - len(df)} rows.")

    # Determine Target Column & Category Conversion if needed
    if "Exam_Score" in df.columns and "PerformanceCategory" not in df.columns:
        def categorize(score):
            if score >= 75:
                return "Excellent"
            elif score >= 68:
                return "Good"
            elif score >= 62:
                return "Average"
            else:
                return "Poor"
        df["PerformanceCategory"] = df["Exam_Score"].apply(categorize)
        df.drop(columns=["Exam_Score"], inplace=True)

    target_col = "PerformanceCategory" if "PerformanceCategory" in df.columns else df.columns[-1]

    # --------------------------------------------------------------------------
    # Phase 9: Check Class Distribution
    # --------------------------------------------------------------------------
    print(f"\n[Phase 9] Class Distribution for target '{target_col}':")
    print(df[target_col].value_counts())

    # --------------------------------------------------------------------------
    # Phase 10: Exploratory Data Analysis (EDA) - Save Graphs to reports/
    # --------------------------------------------------------------------------
    print("\n[Phase 10] Generating & Saving EDA Graphs into 'reports/'...")
    plt.style.use("ggplot")

    # 1. Target Class Count Plot
    plt.figure(figsize=(8, 5))
    sns.countplot(data=df, x=target_col, palette="Set2")
    plt.title("Student Performance Category Distribution", fontsize=14, fontweight="bold")
    plt.savefig(REPORTS_DIR / "eda_target_distribution.png", dpi=300, bbox_inches="tight")
    plt.close()

    # 2. Histograms for Numerical Features
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if num_cols:
        df[num_cols].hist(bins=15, figsize=(14, 10), color="skyblue", edgecolor="black")
        plt.suptitle("Numerical Features Distribution Histograms", fontsize=16, fontweight="bold")
        plt.tight_layout()
        plt.savefig(REPORTS_DIR / "eda_histograms.png", dpi=300, bbox_inches="tight")
        plt.close()

    # 3. Correlation Heatmap
    if len(num_cols) > 1:
        plt.figure(figsize=(10, 8))
        sns.heatmap(df[num_cols].corr(), annot=True, fmt=".2f", cmap="coolwarm", cbar=True)
        plt.title("Numerical Features Correlation Heatmap", fontsize=14, fontweight="bold")
        plt.savefig(REPORTS_DIR / "eda_correlation_heatmap.png", dpi=300, bbox_inches="tight")
        plt.close()

    # 4. Boxplots
    if len(num_cols) > 0:
        plt.figure(figsize=(12, 6))
        sns.boxplot(data=df[num_cols], palette="Set3")
        plt.xticks(rotation=45)
        plt.title("Numerical Features Outlier Boxplots", fontsize=14, fontweight="bold")
        plt.savefig(REPORTS_DIR / "eda_boxplots.png", dpi=300, bbox_inches="tight")
        plt.close()

    print("All EDA graphs saved successfully to 'reports/'.")

    # --------------------------------------------------------------------------
    # Phase 11 & 12: Preprocess & Encode Features using DataPreprocessor
    # --------------------------------------------------------------------------
    print("\n[Phase 11 & 12] Preprocessing and Encoding Features...")
    sys.path.append(str(BASE_DIR / "backend"))
    from app.ml.preprocessor import DataPreprocessor, TARGET_CATEGORY_MAPPING, CATEGORICAL_MAPPINGS, FEATURE_COLUMNS

    preprocessor = DataPreprocessor()
    df_clean, _ = preprocessor.clean_dataset(df)
    X, y = preprocessor.encode_features(df_clean, target_col=target_col)
    feature_names = FEATURE_COLUMNS

    # --------------------------------------------------------------------------
    # Phase 13: Train-Test Split (80/20, stratify=y, random_state=42)
    # --------------------------------------------------------------------------
    print("\n[Phase 13] Splitting Dataset (80% Train, 20% Test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"   X_train: {X_train.shape}, X_test: {X_test.shape}")

    # --------------------------------------------------------------------------
    # Phase 14: Feature Scaling (StandardScaler)
    # --------------------------------------------------------------------------
    print("\n[Phase 14] Feature Scaling with StandardScaler()...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save Scaler & Metadata Artifacts
    scaler_path = MODELS_DIR / "scaler.pkl"
    encoder_path = MODELS_DIR / "encoder.pkl"
    features_path = MODELS_DIR / "features.pkl"

    joblib.dump(scaler, scaler_path)
    
    # Store standard encoders dict
    target_le = LabelEncoder()
    target_le.classes_ = np.array(["Poor", "Average", "Good", "Excellent"])
    joblib.dump({"PerformanceCategory": target_le}, encoder_path)
    joblib.dump(feature_names, features_path)

    print(f"Saved scaler to: {scaler_path}")
    print(f"Saved label encoders to: {encoder_path}")
    print(f"Saved feature list to: {features_path}")

    # --------------------------------------------------------------------------
    # Phase 15 & 16: Train Multiple Models & Hyperparameter Tuning
    # --------------------------------------------------------------------------
    print("\n[Phases 15 & 16] Training & Hyperparameter Tuning Models...")

    # 1. Random Forest Tuning (GridSearchCV)
    print("   -> Tuning Random Forest with GridSearchCV...")
    rf_param_grid = {
        "n_estimators": [50, 100],
        "max_depth": [6, 10]
    }
    rf_grid = GridSearchCV(
        RandomForestClassifier(random_state=42),
        param_grid=rf_param_grid,
        cv=3,
        scoring="accuracy",
        n_jobs=-1
    )
    rf_grid.fit(X_train_scaled, y_train)
    best_rf = rf_grid.best_estimator_
    print(f"      Best RF Params: {rf_grid.best_params_}")

    # 2. XGBoost Tuning (GridSearchCV) if available
    best_xgb = None
    if xgb is not None:
        print("   -> Tuning XGBoost with GridSearchCV...")
        xgb_param_grid = {
            "learning_rate": [0.1],
            "max_depth": [4, 6],
            "n_estimators": [50, 100]
        }
        xgb_grid = GridSearchCV(
            xgb.XGBClassifier(eval_metric="mlogloss", random_state=42),
            param_grid=xgb_param_grid,
            cv=3,
            scoring="accuracy",
            n_jobs=-1
        )
        xgb_grid.fit(X_train_scaled, y_train)
        best_xgb = xgb_grid.best_estimator_
        print(f"      Best XGB Params: {xgb_grid.best_params_}")

    # Additional Base Models
    models = {
        "Random Forest (Primary)": best_rf,
        "Decision Tree": DecisionTreeClassifier(max_depth=6, random_state=42),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "SVM": SVC(kernel="rbf", C=1.0, probability=True, random_state=42),
        "KNN": KNeighborsClassifier(n_neighbors=5)
    }

    if lgb is not None:
        models["LightGBM Classifier"] = lgb.LGBMClassifier(random_state=42, verbose=-1)
    if best_xgb is not None:
        models["XGBoost Classifier"] = best_xgb

    # --------------------------------------------------------------------------
    # Phase 17, 18 & 19: 30-Iteration Repeated Training & Evaluation
    # --------------------------------------------------------------------------
    N_ITERATIONS = 30
    print(f"\nRunning 30 Training Iterations across different random seeds (1..30)...")

    iteration_results = {m: [] for m in models.keys()}
    best_overall_score = -1.0
    best_overall_model_obj = None
    best_overall_model_name = ""

    for i in range(1, N_ITERATIONS + 1):
        # Create fresh split for iteration i
        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=0.20, random_state=i * 42, stratify=y
        )
        scaler_i = StandardScaler()
        X_tr_scaled = scaler_i.fit_transform(X_tr)
        X_te_scaled = scaler_i.transform(X_te)

        for name, clf in models.items():
            clf.fit(X_tr_scaled, y_tr)
            y_pred = clf.predict(X_te_scaled)
            acc = accuracy_score(y_te, y_pred)
            iteration_results[name].append(acc)

            if acc > best_overall_score:
                best_overall_score = acc
                best_overall_model_name = name
                best_overall_model_obj = clf

        if i % 5 == 0 or i == 1 or i == N_ITERATIONS:
            print(f"   Completed Iteration {i}/{N_ITERATIONS}...")

    # Calculate 30-Run Summary Metrics
    summary_stats = []
    for name, scores in iteration_results.items():
        scores_pct = np.array(scores) * 100
        summary_stats.append({
            "Model": name,
            "Mean Acc (%)": round(float(np.mean(scores_pct)), 2),
            "Std Dev (%)": round(float(np.std(scores_pct)), 2),
            "Min Acc (%)": round(float(np.min(scores_pct)), 2),
            "Max Acc (%)": round(float(np.max(scores_pct)), 2),
            "95% CI (%)": f"{round(float(np.mean(scores_pct) - 1.96 * np.std(scores_pct)), 2)} - {round(float(np.mean(scores_pct) + 1.96 * np.std(scores_pct)), 2)}"
        })

    summary_df = pd.DataFrame(summary_stats).sort_values(by="Mean Acc (%)", ascending=False).reset_index(drop=True)
    print("\n" + "=" * 90)
    print("30-ITERATION ACCURACY & STABILITY BENCHMARK REPORT")
    print("=" * 90)
    print(summary_df.to_string(index=False))
    print("=" * 90)

    # Save 30-Iteration Boxplot Chart
    plt.figure(figsize=(10, 6))
    plot_data = pd.DataFrame({k: np.array(v) * 100 for k, v in iteration_results.items()})
    sns.boxplot(data=plot_data, palette="Set2")
    plt.xticks(rotation=30, ha="right")
    plt.title("30-Iteration Accuracy Distribution Across Random Splits (%)", fontsize=13, fontweight="bold")
    plt.ylabel("Accuracy (%)")
    plt.savefig(REPORTS_DIR / "30_iterations_accuracy_boxplot.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Saved 30-iteration accuracy boxplot to 'reports/30_iterations_accuracy_boxplot.png'.")

    # --------------------------------------------------------------------------
    # Phase 19: Select Best Overall Model Across 30 Runs
    # --------------------------------------------------------------------------
    best_row = summary_df.iloc[0]
    print(f"\n[Phase 19] Top Model across 30 Iterations: {best_row['Model']}")
    print(f"   Mean Accuracy: {best_row['Mean Acc (%)']}% ± {best_row['Std Dev (%)']}% | Peak Max: {best_row['Max Acc (%)']}%")

    # --------------------------------------------------------------------------
    # Phase 20: Save Best Model Artifacts
    # --------------------------------------------------------------------------
    print("\n[Phase 20] Saving Best Model Artifacts to 'models/':")
    student_model_path = MODELS_DIR / "student_model.pkl"
    best_model_path = MODELS_DIR / "best_model.joblib"

    joblib.dump(best_overall_model_obj, student_model_path)
    joblib.dump(best_overall_model_obj, best_model_path)

    print(f"Saved model to: {student_model_path}")
    print(f"Saved model to: {best_model_path}")
    print("\n30-Iteration Training Pipeline Complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Student Performance ML Training Pipeline")
    parser.add_argument("--dataset", type=str, default=str(DEFAULT_DATASET_PATH), help="Path to CSV dataset")
    args = parser.parse_args()
    run_pipeline(Path(args.dataset))
