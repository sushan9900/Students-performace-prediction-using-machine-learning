# User and Developer Guide

## Project: Student Performance Prediction Using Machine Learning

---

## Part 1: Using the Application

### Dashboard
Open `http://localhost:5173` after both servers are running. The dashboard shows summary cards (total datasets uploaded, models trained, predictions made) and performance distribution charts pulled from the database.

### Uploading a Dataset
1. Click **Dataset Overview** in the sidebar
2. Click **Upload New CSV** and select a student CSV file
3. The system will show column names, row count, and any missing values detected
4. Click **Auto-Impute (Mean)** if you want to fill missing values automatically before training

### Training Models
1. Click **Model Training & Evaluation** in the sidebar
2. Check the algorithms you want to run (or leave all checked)
3. Set train/test split and cross-validation folds (defaults are fine)
4. Click **Train Selected Models**
5. Results table shows accuracy, F1, and CV scores for each algorithm
6. Click a row to see its confusion matrix and feature importance chart

### Making Predictions
1. Click **Performance Predictor** in the sidebar
2. Fill in the student details using the sliders and dropdowns
3. Click **Predict Student Performance**
4. The result shows the predicted category (Excellent / Good / Average / Poor) and a probability bar for each class

### Viewing History
The **Prediction History** page shows a searchable table of all past predictions with input features and results.

---

## Part 2: Developer Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

The `.env` file controls database URL, CORS origins, model directory path, etc. SQLite is used by default so no extra setup is needed.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite config proxies `/api` requests to `http://localhost:8000` during development, so you don't have to worry about CORS in dev mode.

### Running Tests

```bash
pytest
```

Tests cover the main API endpoints and the ML preprocessing pipeline. Run from the project root directory.

### Standalone ML Scripts

These scripts are useful for training/evaluating models outside the web app:

```bash
# generate a synthetic dataset
python machine_learning/utils_standalone.py

# train models via CLI
python machine_learning/train_standalone.py --dataset dataset/student_performance_dataset.csv

# evaluate a saved model
python machine_learning/evaluate_standalone.py --model models/best_model.joblib
```

---

## Common Issues

**Model not found error on prediction page** — Make sure you train models first from the Model Training page before trying to predict.

**Frontend shows blank page** — Check that the backend is running on port 8000. Check browser console for CORS errors.

**CSV upload fails** — Ensure the file is under 10MB and has at least one recognizable column like `Attendance`, `Study Hours`, or `PerformanceCategory`.
