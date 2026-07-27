import numpy as np
import pandas as pd
from typing import List, Tuple, Dict, Any
from sklearn.feature_selection import SelectKBest, f_classif


def engineer_academic_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds derived features to the dataframe based on existing columns.
    Creates a composite academic score, an attendance-study interaction term,
    and a binary risk flag for students with low attendance or low marks.
    """
    df_eng = df.copy()

    # Normalize column names to lowercase for easier matching
    cols = {col.lower().strip(): col for col in df_eng.columns}

    prev_marks_col = cols.get("previous_semester_marks", cols.get("prev_marks"))
    assign_col = cols.get("assignment_score", cols.get("assignments"))
    internal_col = cols.get("internal_assessment", cols.get("internal_marks"))
    attend_col = cols.get("attendance", cols.get("attendance_percentage"))
    study_col = cols.get("study_hours", cols.get("study_time"))

    # Weighted composite score — past marks carry the most weight
    if prev_marks_col and assign_col and internal_col:
        df_eng["total_academic_score"] = (
            (df_eng[prev_marks_col] * 0.40) +
            (df_eng[assign_col] * 0.30) +
            (df_eng[internal_col] * 0.30)
        )

    # Interaction term: higher attendance + more study hours = stronger signal
    if attend_col and study_col:
        df_eng["attendance_study_interaction"] = (df_eng[attend_col] / 100.0) * df_eng[study_col]

    # Flag students who are likely at risk (attendance < 60% or marks < 40)
    if attend_col and prev_marks_col:
        df_eng["academic_risk_flag"] = np.where(
            (df_eng[attend_col] < 60.0) | (df_eng[prev_marks_col] < 40.0), 1, 0
        )

    return df_eng


def select_top_features(
    X: pd.DataFrame,
    y: pd.Series,
    top_k: int = 10
) -> Tuple[pd.DataFrame, List[str], Dict[str, float]]:
    """
    Selects the top K most predictive features using ANOVA F-test (SelectKBest).
    Returns the reduced feature matrix, selected feature names, and all feature scores.
    """
    k = min(top_k, X.shape[1])
    selector = SelectKBest(score_func=f_classif, k=k)
    selector.fit(X, y)

    scores = selector.scores_
    feature_scores = {}
    for col_name, score in zip(X.columns, scores):
        feature_scores[str(col_name)] = float(score) if not np.isnan(score) else 0.0

    sorted_features = sorted(feature_scores.items(), key=lambda x: x[1], reverse=True)
    selected_names = [item[0] for item in sorted_features[:k]]

    X_selected = X[selected_names]

    return X_selected, selected_names, dict(sorted_features)
