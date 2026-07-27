import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder


FEATURE_COLUMNS: List[str] = [
    "gender",
    "age",
    "attendance",
    "study_hours",
    "previous_semester_marks",
    "assignment_score",
    "internal_assessment",
    "class_participation",
    "internet_access",
    "parental_education",
    "family_income",
    "extra_curricular_activities"
]

CATEGORICAL_MAPPINGS: Dict[str, Dict[str, int]] = {
    "gender": {"Female": 0, "Male": 1, "Other": 2},
    "internet_access": {"No": 0, "Yes": 1},
    "extra_curricular_activities": {"No": 0, "Yes": 1},
    "parental_education": {
        "High School": 0,
        "Associate": 1,
        "Bachelor": 2,
        "Master": 3,
        "Doctorate": 4
    },
    "family_income": {"Low": 0, "Medium": 1, "High": 2}
}

TARGET_CATEGORY_MAPPING: Dict[str, int] = {
    "Poor": 0,
    "Average": 1,
    "Good": 2,
    "Excellent": 3
}

REVERSE_TARGET_MAPPING: Dict[int, str] = {
    0: "Poor",
    1: "Average",
    2: "Good",
    3: "Excellent"
}


class DataPreprocessor:
    """
    Handles all preprocessing steps — cleaning, encoding, scaling, and splitting.
    Keeps the fitted scaler in memory so training and inference use the same transformation.
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.target_encoder = LabelEncoder()
        self.feature_names: List[str] = FEATURE_COLUMNS
        self.is_fitted: bool = False

        # Try to load a previously saved scaler if one exists
        try:
            import joblib
            from app.core.config import settings
            scaler_path = settings.MODEL_DIR / "scaler.pkl"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                self.is_fitted = True
        except Exception:
            pass

    def clean_dataset(
        self,
        df: pd.DataFrame,
        missing_strategy: str = "mean",
        remove_duplicates: bool = True
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Removes duplicate rows and fills in missing values.
        Supports mean, median, mode, and drop strategies.
        Returns the cleaned dataframe and a summary log dict.
        """
        df_clean = df.copy()
        initial_rows = len(df_clean)
        imputed_cols = []

        if remove_duplicates:
            df_clean = df_clean.drop_duplicates()

        rows_after_duplicates = len(df_clean)
        duplicate_count = initial_rows - rows_after_duplicates

        for col in df_clean.columns:
            if df_clean[col].isnull().sum() > 0:
                imputed_cols.append(col)
                if missing_strategy == "drop":
                    df_clean = df_clean.dropna(subset=[col])
                elif missing_strategy == "median" and pd.api.types.is_numeric_dtype(df_clean[col]):
                    df_clean[col] = df_clean[col].fillna(df_clean[col].median())
                elif missing_strategy == "mode":
                    df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])
                else:
                    # default: mean for numeric, mode for categorical
                    if pd.api.types.is_numeric_dtype(df_clean[col]):
                        df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
                    else:
                        df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])

        logs = {
            "initial_rows": initial_rows,
            "final_rows": len(df_clean),
            "duplicates_removed": duplicate_count,
            "imputed_columns": imputed_cols
        }

        return df_clean, logs

    def encode_features(
        self,
        df: pd.DataFrame,
        target_col: str = "PerformanceCategory"
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Converts categorical text columns to integers and separates X from y.
        Also handles common column name variations from different CSV datasets.
        """
        df_encoded = df.copy()

        col_map = {col: col.lower().strip().replace(" ", "_") for col in df_encoded.columns}
        df_encoded.rename(columns=col_map, inplace=True)

        # handle alternate column name conventions
        alias_map = {
            "hours_studied": "study_hours",
            "previous_scores": "previous_semester_marks",
            "extracurricular_activities": "extra_curricular_activities",
            "parental_education_level": "parental_education"
        }
        df_encoded.rename(columns=alias_map, inplace=True)

        target_col_clean = target_col.lower().strip().replace(" ", "_")
        target_found = None
        for cand in [target_col_clean, "performancecategory", "performance_category", "exam_score", "examscore"]:
            if cand in df_encoded.columns:
                target_found = cand
                break

        if target_found:
            y_raw = df_encoded[target_found]
            df_encoded = df_encoded.drop(columns=[target_found])
            if target_found in ["exam_score", "examscore"] and pd.api.types.is_numeric_dtype(y_raw):
                # bin continuous exam score into 4 categories
                y_raw = pd.cut(
                    y_raw,
                    bins=[-1, 57, 71, 84, 100],
                    labels=["Poor", "Average", "Good", "Excellent"]
                ).astype(str)
        else:
            if "previous_semester_marks" in df_encoded.columns and pd.api.types.is_numeric_dtype(df_encoded["previous_semester_marks"]):
                y_raw = pd.cut(
                    df_encoded["previous_semester_marks"],
                    bins=[-1, 59, 74, 89, 100],
                    labels=["Poor", "Average", "Good", "Excellent"]
                ).astype(str)
            else:
                cats = ["Poor", "Average", "Good", "Excellent"]
                y_raw = pd.Series([cats[i % 4] for i in range(len(df_encoded))])

        if pd.api.types.is_numeric_dtype(y_raw) and not isinstance(y_raw.dtype, pd.CategoricalDtype):
            y = y_raw.astype(int)
        else:
            y = y_raw.map(TARGET_CATEGORY_MAPPING).fillna(1).astype(int)

        for feature_key, mapping in CATEGORICAL_MAPPINGS.items():
            if feature_key in df_encoded.columns:
                if not pd.api.types.is_numeric_dtype(df_encoded[feature_key]):
                    df_encoded[feature_key] = df_encoded[feature_key].map(mapping).fillna(0).astype(int)

        # fill in missing columns with sensible defaults
        if "age" not in df_encoded.columns:
            df_encoded["age"] = 20
        if "assignment_score" not in df_encoded.columns:
            df_encoded["assignment_score"] = df_encoded.get("previous_semester_marks", 70.0)
        if "internal_assessment" not in df_encoded.columns:
            df_encoded["internal_assessment"] = df_encoded.get("previous_semester_marks", 68.0)
        if "class_participation" not in df_encoded.columns:
            df_encoded["class_participation"] = df_encoded.get("attendance", 70.0)

        X = df_encoded[FEATURE_COLUMNS].copy()

        return X, y

    def prepare_train_test_split(
        self,
        df: pd.DataFrame,
        target_col: str = "PerformanceCategory",
        test_size: float = 0.2,
        random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str]]:
        """
        Full preprocessing pipeline — clean, encode, scale, and split.
        Returns X_train, X_test, y_train, y_test arrays plus feature names.
        """
        df_clean, _ = self.clean_dataset(df)

        X, y = self.encode_features(df_clean, target_col=target_col)
        self.feature_names = list(X.columns)

        n_samples = len(y)
        n_classes = len(np.unique(y))
        test_count = int(np.floor(n_samples * test_size))
        train_count = n_samples - test_count
        min_class_count = min(pd.Series(y).value_counts()) if n_classes > 0 else 0

        # use stratified split if we have enough samples per class
        use_stratify = (
            n_classes > 1
            and min_class_count >= 2
            and test_count >= n_classes
            and train_count >= n_classes
        )
        stratify_y = y if use_stratify else None

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=stratify_y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        self.is_fitted = True

        return X_train_scaled, X_test_scaled, y_train.values, y_test.values, self.feature_names

    def transform_single_input(self, input_dict: Dict[str, Any]) -> np.ndarray:
        """
        Converts a single student feature dict into a scaled numpy array for real-time inference.
        """
        feature_map: Dict[str, float] = {
            "gender": float(CATEGORICAL_MAPPINGS["gender"].get(input_dict.get("gender", "Female"), 0)),
            "age": float(input_dict.get("age", 20)),
            "attendance": float(input_dict.get("attendance", 75.0)),
            "study_hours": float(input_dict.get("study_hours", 12.0)),
            "previous_semester_marks": float(input_dict.get("previous_semester_marks", 68.0)),
            "assignment_score": float(input_dict.get("assignment_score", 70.0)),
            "internal_assessment": float(input_dict.get("internal_assessment", 68.0)),
            "class_participation": float(input_dict.get("class_participation", 70.0)),
            "internet_access": float(CATEGORICAL_MAPPINGS["internet_access"].get(input_dict.get("internet_access", "Yes"), 1)),
            "parental_education": float(CATEGORICAL_MAPPINGS["parental_education"].get(input_dict.get("parental_education", "Bachelor"), 2)),
            "family_income": float(CATEGORICAL_MAPPINGS["family_income"].get(input_dict.get("family_income", "Medium"), 1)),
            "extra_curricular_activities": float(CATEGORICAL_MAPPINGS["extra_curricular_activities"].get(input_dict.get("extra_curricular_activities", "Yes"), 1)),
        }

        ordered_row = [feature_map.get(col, 0.0) for col in FEATURE_COLUMNS]
        raw_array = np.array([ordered_row], dtype=float)

        if self.is_fitted:
            return self.scaler.transform(raw_array)

        return raw_array
