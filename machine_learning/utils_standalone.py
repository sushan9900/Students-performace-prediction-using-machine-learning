from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

BASE_DIR = Path(__file__).resolve().parent.parent
REPORTS_DIR = BASE_DIR / "reports"
DATASET_DIR = BASE_DIR / "dataset"


def generate_synthetic_student_dataset(output_path: Path = None, num_samples: int = 500) -> Path:
    """
    Generates a synthetic student dataset CSV for testing purposes.
    Saves to dataset/ folder by default.
    """
    if output_path is None:
        output_path = DATASET_DIR / "student_performance_dataset.csv"

    output_path.parent.mkdir(parents=True, exist_ok=True)

    np.random.seed(42)

    genders = np.random.choice(["Female", "Male", "Other"], size=num_samples, p=[0.48, 0.48, 0.04])
    ages = np.random.randint(17, 26, size=num_samples)
    attendance = np.round(np.random.uniform(50.0, 99.0, size=num_samples), 1)
    study_hours = np.round(np.random.uniform(4.0, 35.0, size=num_samples), 1)
    prev_marks = np.round(np.random.uniform(40.0, 98.0, size=num_samples), 1)
    assign_scores = np.round(np.random.uniform(45.0, 99.0, size=num_samples), 1)
    internal = np.round(np.round(assign_scores * 0.9 + np.random.normal(0, 3, size=num_samples)), 1)
    internal = np.clip(internal, 40.0, 100.0)
    participation = np.round(np.random.uniform(50.0, 98.0, size=num_samples), 1)
    internet = np.random.choice(["Yes", "No"], size=num_samples, p=[0.85, 0.15])
    parent_edu = np.random.choice(
        ["High School", "Associate", "Bachelor", "Master", "Doctorate"],
        size=num_samples,
        p=[0.25, 0.20, 0.35, 0.15, 0.05]
    )
    income = np.random.choice(["Low", "Medium", "High"], size=num_samples, p=[0.30, 0.50, 0.20])
    extra = np.random.choice(["Yes", "No"], size=num_samples, p=[0.60, 0.40])

    # composite score used to derive the target label
    total_score = (prev_marks * 0.35) + (assign_scores * 0.25) + (internal * 0.25) + (attendance * 0.15)

    categories = []
    for score in total_score:
        if score >= 85.0:
            categories.append("Excellent")
        elif score >= 70.0:
            categories.append("Good")
        elif score >= 55.0:
            categories.append("Average")
        else:
            categories.append("Poor")

    df = pd.DataFrame({
        "Gender": genders,
        "Age": ages,
        "Attendance": attendance,
        "Study Hours": study_hours,
        "Previous Semester Marks": prev_marks,
        "Assignment Score": assign_scores,
        "Internal Assessment": internal,
        "Class Participation": participation,
        "Internet Access": internet,
        "Parental Education": parent_edu,
        "Family Income": income,
        "Extra Curricular Activities": extra,
        "PerformanceCategory": categories
    })

    df.to_csv(output_path, index=False)
    print(f"Generated dataset ({num_samples} records) saved to: {output_path}")
    return output_path


def plot_confusion_matrix(cm_array: np.ndarray, labels: list, save_filename: str = "confusion_matrix.png") -> Path:
    """Saves a Seaborn confusion matrix heatmap to the reports directory."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    save_path = REPORTS_DIR / save_filename

    plt.figure(figsize=(7, 5))
    sns.heatmap(cm_array, annot=True, fmt="d", cmap="Blues", xticklabels=labels, yticklabels=labels)
    plt.title("Student Performance Prediction - Confusion Matrix")
    plt.xlabel("Predicted Category")
    plt.ylabel("Actual Category")
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()

    return save_path


def plot_feature_importances(importances_dict: dict, save_filename: str = "feature_importance.png") -> Path:
    """Saves a horizontal bar chart of feature importance scores."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    save_path = REPORTS_DIR / save_filename

    features = list(importances_dict.keys())
    scores = list(importances_dict.values())

    plt.figure(figsize=(9, 5))
    sns.barplot(x=scores, y=features, palette="viridis")
    plt.title("Feature Importance - Student Performance")
    plt.xlabel("Importance Score")
    plt.ylabel("Feature")
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()

    return save_path
