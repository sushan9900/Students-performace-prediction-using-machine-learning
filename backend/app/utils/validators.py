# Purpose of File: Provides validation helper functions to verify that uploaded
#                   CSV datasets contain required student feature columns, valid
#                   target variables, sufficient training rows, and expected data types.
#
# Inputs        : Pandas DataFrames or column lists.
# Outputs       : Validation result dictionary with boolean flags and error messages.
# Execution Flow:
#                 1. Maps standardized student feature keywords against CSV columns.
#                 2. Validates target column availability (e.g. PerformanceCategory).
#                 3. Verifies minimum dataset row count requirements for ML cross-validation.
# ==============================================================================

from typing import Dict, List, Tuple, Any
import pandas as pd


# ------------------------------------------------------------------------------
# Standard Student Feature Mapping Definitions
# ------------------------------------------------------------------------------
REQUIRED_FEATURE_ALIASES: Dict[str, List[str]] = {
    "gender": ["gender", "sex"],
    "age": ["age", "student_age"],
    "attendance": ["attendance", "attendance_percentage", "attendance_rate", "attendance_score"],
    "study_hours": ["study_hours", "study_time", "hours_studied", "weekly_study_hours"],
    "previous_semester_marks": ["previous_semester_marks", "prev_marks", "previous_score", "past_marks", "gpa"],
    "assignment_score": ["assignment_score", "assignment_marks", "assignments"],
    "internal_assessment": ["internal_assessment", "internal_marks", "midterm_score"],
    "class_participation": ["class_participation", "participation", "participation_score"],
    "internet_access": ["internet_access", "internet", "has_internet"],
    "parental_education": ["parental_education", "parent_education", "education_parent"],
    "family_income": ["family_income", "income_level", "family_income_level"],
    "extra_curricular_activities": ["extra_curricular_activities", "extracurricular", "activities"]
}

TARGET_COLUMN_ALIASES: List[str] = [
    "performancecategory", "performance_category", "grade", "target", "pass_fail", "result"
]


def validate_dataset_schema(df: pd.DataFrame, target_col: str = "PerformanceCategory") -> Tuple[bool, List[str], Dict[str, str]]:
    """
    Validates if a Pandas DataFrame contains the necessary feature columns for student prediction.
    

    # 1. Feature Columns Match
    for canonical_feature, aliases in REQUIRED_FEATURE_ALIASES.items():
        found_col = None
        for alias in aliases:
            if alias.lower() in actual_columns_lower:
                found_col = actual_columns_lower[alias.lower()]
                break
        
        if found_col:
            column_mapping[canonical_feature] = found_col
        else:
            messages.append(f"Missing recommended feature column matching: '{canonical_feature}'.")

    # 2. Target Column Check
    target_found = False
    if target_col.lower() in actual_columns_lower:
        column_mapping["target"] = actual_columns_lower[target_col.lower()]
        target_found = True
    else:
        for alias in TARGET_COLUMN_ALIASES:
            if alias in actual_columns_lower:
                column_mapping["target"] = actual_columns_lower[alias]
                target_found = True
                break

    if not target_found:
        messages.append(f"Target column '{target_col}' not found in dataset headers.")

    # 3. Minimum Row Count Check
    if len(df) < 10:
        messages.append(f"Dataset has only {len(df)} rows. Minimum 10 rows required for ML model training.")

    # Schema is valid if target exists and at least 6 core features are matched
    is_valid = target_found and (len(column_mapping) >= 6) and (len(df) >= 10)
    
    return is_valid, messages, column_mapping


def check_dataset_health(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes quick health metrics for an uploaded DataFrame.
    

    return {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "total_cells": total_cells,
        "missing_cells_total": missing_cells,
        "missing_percentage": missing_percentage,
        "duplicate_rows": duplicate_rows,
        "is_healthy": (missing_percentage < 30.0) and (duplicate_rows < len(df) * 0.5)
    }
