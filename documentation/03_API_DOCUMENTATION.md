# API Documentation

## Base URL: `http://localhost:8000/api/v1`

Full interactive docs available at: `http://localhost:8000/docs`

---

## Dataset Endpoints

### POST `/dataset/upload`
Upload a student CSV dataset.

**Request:** `multipart/form-data` with `file` field (max 10MB)

**Response (201):**
```json
{
  "id": 1,
  "filename": "student_performance_dataset.csv",
  "row_count": 500,
  "column_count": 13,
  "file_size_bytes": 24500,
  "uploaded_at": "2026-07-24T21:45:00.000Z",
  "is_active": true
}
```

### GET `/dataset/preview/{dataset_id}`
Returns sample rows, missing value counts, and column types.

```json
{
  "filename": "student_performance_dataset.csv",
  "row_count": 500,
  "columns": ["Gender", "Age", "Attendance", "PerformanceCategory"],
  "sample_rows": [
    { "Gender": "Female", "Age": 20, "Attendance": 92.5, "PerformanceCategory": "Excellent" }
  ],
  "missing_values": { "Attendance": 0, "Study Hours": 2 },
  "duplicate_count": 0
}
```

---

## ML Training Endpoints

### POST `/ml/train`
Trains selected ML algorithms and returns comparison results.

**Request body:**
```json
{
  "target_column": "PerformanceCategory",
  "test_size": 0.2,
  "random_state": 42,
  "cv_folds": 5,
  "selected_algorithms": ["random_forest", "decision_tree", "logistic_regression", "svm", "knn", "naive_bayes"]
}
```

**Response (200):**
```json
{
  "total_models_trained": 6,
  "best_model_name": "Random Forest (Primary)",
  "best_model_type": "random_forest",
  "best_accuracy": 0.945,
  "models": [
    {
      "model_name": "Random Forest (Primary)",
      "model_type": "random_forest",
      "is_best_model": true,
      "accuracy": 0.945,
      "f1_score": 0.946,
      "cv_score_mean": 0.938
    }
  ]
}
```

---

## Prediction Endpoints

### POST `/predict/single`
Predicts performance for one student.

**Request body:**
```json
{
  "student_identifier": "Student #101",
  "features": {
    "gender": "Female",
    "age": 20,
    "attendance": 92.5,
    "study_hours": 22.5,
    "previous_semester_marks": 88.0,
    "assignment_score": 91.0,
    "internal_assessment": 89.5,
    "class_participation": 90.0,
    "internet_access": "Yes",
    "parental_education": "Bachelor",
    "family_income": "Medium",
    "extra_curricular_activities": "Yes"
  }
}
```

**Response (200):**
```json
{
  "predicted_category": "Excellent",
  "confidence_probabilities": {
    "Excellent": 0.885,
    "Good": 0.102,
    "Average": 0.011,
    "Poor": 0.002
  },
  "model_used": "Random Forest (Primary)"
}
```

---

## Dashboard Endpoints

### GET `/dashboard/summary`
Returns aggregate stats — total datasets, trained models, predictions made, and best model accuracy.
