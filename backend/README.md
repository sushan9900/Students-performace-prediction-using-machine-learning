# Student Performance Prediction System - Backend API

Production-ready FastAPI backend for predicting student academic performance using Machine Learning models (*Random Forest*, *Decision Tree*, *Logistic Regression*, *Support Vector Machine*, *K-Nearest Neighbors*, and *Naive Bayes*).

---

## 📐 Clean Architecture Overview

```text
backend/
├── app/
│   ├── core/           # Environment settings & configuration (config.py)
│   ├── database/       # ORM Session setup & DB tables (session.py, models.py)
│   ├── schemas/        # Pydantic V2 Request & Response schemas
│   ├── services/       # Core business logic layer (Dataset, ML, Prediction, Dashboard)
│   ├── routers/        # FastAPI HTTP route handlers (/dataset, /ml, /predict, /dashboard)
│   ├── utils/          # CSV File handling & dataset schema validation
│   ├── ml/             # ML Preprocessing, Feature Engineering, Training & Prediction
│   └── main.py         # FastAPI application entry point
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables configuration template
└── README.md           # Backend documentation
```

---

## 🛠️ Technology Stack

- **Framework**: FastAPI (Python 3.12+)
- **ASGI Server**: Uvicorn
- **Database & ORM**: SQLAlchemy 2.0, PostgreSQL (with SQLite zero-config fallback)
- **Data Validation**: Pydantic V2
- **Data Processing**: Pandas, NumPy
- **Machine Learning**: Scikit-Learn, Joblib
- **Visualization**: Matplotlib, Seaborn

---

## ⚡ Quick Start & Installation

### 1. Virtual Environment Setup
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Server running at: `http://localhost:8000`  
Swagger API Docs: `http://localhost:8000/docs`

---

## 📡 REST API Endpoint Documentation

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Dataset** | `POST` | `/api/v1/dataset/upload` | Upload CSV dataset file |
| **Dataset** | `GET` | `/api/v1/dataset/preview/{id}` | Dataset sample & statistics preview |
| **Dataset** | `GET` | `/api/v1/dataset/validate/{id}` | Validate feature columns schema |
| **Dataset** | `POST` | `/api/v1/dataset/clean/{id}` | Auto-clean missing values & duplicates |
| **Machine Learning** | `POST` | `/api/v1/ml/train` | Train & compare 6 ML algorithms |
| **Machine Learning** | `GET` | `/api/v1/ml/models` | List all trained models |
| **Machine Learning** | `GET` | `/api/v1/ml/best-model` | Get highest performing winning model |
| **Prediction** | `POST` | `/api/v1/predict/single` | Predict performance for individual student |
| **Prediction** | `POST` | `/api/v1/predict/batch` | Batch predict multiple students |
| **Prediction** | `GET` | `/api/v1/predict/history` | Get historical prediction logs |
| **Dashboard** | `GET` | `/api/v1/dashboard/stats` | Aggregated dashboard analytics |

---

## 🧪 Running Unit Tests

```bash
pytest
```
