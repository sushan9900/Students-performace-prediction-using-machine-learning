
import sys
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

# Set paths relative to script location
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"


class PerformancePredictor:
    """Inference engine loading saved trained artifacts to predict student outcomes."""

    def __init__(self, models_dir: Path = MODELS_DIR):
        self.models_dir = models_dir

        model_path = models_dir / "student_model.pkl"
        if not model_path.exists():
            model_path = models_dir / "best_model.joblib"

        scaler_path = models_dir / "scaler.pkl"
        encoder_path = models_dir / "encoder.pkl"
        features_path = models_dir / "features.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"Model artifact not found at {model_path}. Please run train_standalone.py first.")

        print(f"Loading Model Artifact from: {model_path}")
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path) if scaler_path.exists() else None
        self.encoders = joblib.load(encoder_path) if encoder_path.exists() else {}
        self.feature_names = joblib.load(features_path) if features_path.exists() else []

    def predict(self, student_dict: dict) -> dict:
        """Processes input feature dict and returns prediction result."""
        input_df = pd.DataFrame([student_dict])

        # Step 1: Categorical Encoding
        for col, le in self.encoders.items():
            if col in input_df.columns:
                val = str(input_df[col].iloc[0])
                if val in le.classes_:
                    input_df[col] = le.transform([val])[0]
                else:
                    input_df[col] = 0

        # Align with saved feature columns
        if self.feature_names:
            for feat in self.feature_names:
                if feat not in input_df.columns:
                    input_df[feat] = 0
            input_df = input_df[self.feature_names]

        # Step 2: Scaling
        if self.scaler:
            X_scaled = self.scaler.transform(input_df)
        else:
            X_scaled = input_df.values

        # Step 3: Inference
        prediction_idx = self.model.predict(X_scaled)[0]

        # Convert label back if encoder exists for target
        if "PerformanceCategory" in self.encoders:
            predicted_label = self.encoders["PerformanceCategory"].inverse_transform([prediction_idx])[0]
        else:
            categories_map = {0: "Poor", 1: "Average", 2: "Good", 3: "Excellent"}
            predicted_label = categories_map.get(prediction_idx, str(prediction_idx))

        # Class Confidence Probabilities
        confidence_scores = {}
        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(X_scaled)[0]
            classes = getattr(self.model, "classes_", list(range(len(probs))))
            for idx, prob in zip(classes, probs):
                if "PerformanceCategory" in self.encoders:
                    cat_name = self.encoders["PerformanceCategory"].inverse_transform([idx])[0]
                else:
                    cat_name = str(idx)
                confidence_scores[cat_name] = round(float(prob), 4)

        return {
            "predicted_category": predicted_label,
            "prediction_index": int(prediction_idx),
            "confidence_scores": confidence_scores
        }


def main():
    parser = argparse.ArgumentParser(description="Predict Student Performance Category")
    parser.add_argument("--hours", type=float, default=22.5, help="Hours Studied")
    parser.add_argument("--attendance", type=float, default=92.0, help="Attendance %")
    parser.add_argument("--scores", type=float, default=88.0, help="Previous Scores")
    args = parser.parse_args()

    predictor = PerformancePredictor()

    sample_input = {
        "Hours_Studied": args.hours,
        "Attendance": args.attendance,
        "Previous_Scores": args.scores,
        "Parental_Involvement": "High",
        "Access_to_Resources": "High",
        "Extracurricular_Activities": "Yes",
        "Sleep_Hours": 7,
        "Motivation_Level": "High",
        "Internet_Access": "Yes",
        "Tutoring_Sessions": 2,
        "Family_Income": "High",
        "Teacher_Quality": "High",
        "School_Type": "Public",
        "Peer_Influence": "Positive",
        "Physical_Activity": 3,
        "Learning_Disabilities": "No",
        "Parental_Education_Level": "Bachelor",
        "Distance_from_Home": "Near",
        "Gender": "Female"
    }

    result = predictor.predict(sample_input)
    print("\n" + "=" * 50)
    print("INFERENCE PREDICTION RESULT")
    print("=" * 50)
    print(f"Predicted Performance Category: {result['predicted_category']}")
    print("Class Confidence Probabilities:")
    for cat, score in result["confidence_scores"].items():
        print(f"   - {cat:<12}: {score * 100:>6.2f}%")
    print("=" * 50)


if __name__ == "__main__":
    main()
