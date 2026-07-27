# System Design and Architecture

## Project: Student Performance Prediction Using Machine Learning

---

## Architecture Overview

The system is structured in layers to keep things clean and testable. Each layer has a single responsibility and doesn't depend on anything above it.

```
React Frontend (TypeScript + Vite + Tailwind)
         |
         | HTTP REST (JSON)
         v
FastAPI Router Layer  (/dataset, /ml, /predict, /dashboard)
         |
         v
Services Layer  (DatasetService, MLService, PredictionService, DashboardService)
         |
      +--+--+
      |     |
      v     v
ML Layer   Database Layer
(Preprocess, Train, Evaluate, Predict)   (SQLAlchemy ORM, SQLite/PostgreSQL)
```

---

## Database ER Diagram

Three main tables are used:

```
datasets                    ml_models
--------                    ---------
id (PK)                     id (PK)
filename                    model_name
file_path                   model_type
row_count                   is_best_model
column_count                file_path (.joblib)
columns_list (JSON)         accuracy
file_size_bytes             precision
uploaded_at                 recall
is_active                   f1_score
                            confusion_matrix (JSON)
                            feature_importance (JSON)
                                  |
                                  | 1:N
                                  v
                            predictions
                            -----------
                            id (PK)
                            student_identifier
                            input_features (JSON)
                            predicted_category
                            confidence_probs (JSON)
                            model_used
                            created_at
```

---

## Data Flow

**Upload and train:**
```
User uploads CSV -> Dataset Router -> File Handler -> saved to /dataset/
                                   -> Dataset table (metadata saved)

User clicks Train -> ML Router -> Preprocessor (clean + encode + scale)
                               -> ModelTrainer (fit 6 classifiers)
                               -> Evaluator (metrics + confusion matrix)
                               -> save .joblib files to /models/
                               -> ml_models table updated
```

**Predict:**
```
User submits form -> Predict Router -> Predictor (load best_model.joblib)
                                    -> scale input features
                                    -> model.predict() + predict_proba()
                                    -> return category + confidence scores
                                    -> save to predictions table
```

---

## Directory Layout

```
backend/app/
├── core/        - app settings, environment config
├── database/    - SQLAlchemy session setup and ORM model definitions
├── schemas/     - Pydantic request/response schemas
├── services/    - business logic (isolated from routers)
├── routers/     - FastAPI route handlers
├── utils/       - file upload helpers, CSV validation
└── ml/          - preprocessing, training, evaluation, inference
```

---

## Technology Choices

| Component | Choice | Reason |
|---|---|---|
| Frontend framework | React 19 + Vite | Fast HMR, component-based UI |
| Styling | Tailwind CSS | Utility-first, easy responsive design |
| Charts | Recharts | Simple React-native charting |
| Backend | FastAPI | Async, auto-generates Swagger docs |
| ORM | SQLAlchemy 2.0 | Works with SQLite and PostgreSQL |
| ML Library | Scikit-Learn | Standard, well-documented, easy joblib serialization |
| Model storage | Joblib | Faster than pickle for NumPy-heavy objects |
