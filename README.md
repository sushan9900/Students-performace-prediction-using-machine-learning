# Student Performance Prediction Using Machine Learning

A full-stack web application built for my final year engineering project. The idea is to predict student academic performance (Excellent / Good / Average / Poor) using machine learning, based on various academic and demographic factors.

The system lets you upload a student CSV dataset, clean missing values, train multiple ML classifiers, compare their accuracy, and then predict performance for individual students through a form interface.

---

## What It Does

- Upload student CSV datasets (up to 10MB)
- Auto-clean missing values with mean/median/mode imputation
- Train and compare 6 classification algorithms at once
- Automatically picks the best performing model
- Real-time prediction for individual students with confidence scores
- Interactive charts — donut charts, bar graphs, scatter plots, confusion matrix
- Prediction history with searchable audit log

---

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, React Router v6, Axios, Lucide React

**Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn, SQLite (with PostgreSQL support)

**Machine Learning:** Scikit-Learn, Pandas, NumPy, Joblib, Matplotlib, Seaborn

---

## Project Structure

```
student-performance-prediction/
├── backend/
│   ├── app/
│   │   ├── core/          # App settings and config
│   │   ├── database/      # SQLAlchemy session and ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic (Dataset, ML, Prediction, Dashboard)
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── utils/         # File upload and CSV validation helpers
│   │   ├── ml/            # Preprocessor, trainer, evaluator, predictor
│   │   └── main.py
│   └── tests/             # Pytest unit tests
│
├── frontend/
│   └── src/
│       ├── components/    # Navbar, Sidebar, MetricCard, FileUploadModal
│       ├── pages/         # Dashboard, Dataset, Models, Predictor, History, Reports
│       ├── charts/        # Recharts wrappers
│       ├── services/      # Axios API calls
│       └── types/         # TypeScript interfaces
│
├── machine_learning/      # Standalone CLI scripts for training/evaluation
├── dataset/               # Sample CSV dataset
├── models/                # Saved .joblib model files go here
├── reports/               # Exported chart images go here
└── documentation/         # Project report and docs
```

---

## How to Run

### 1. Backend (FastAPI)

```bash
cd backend

python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`  
Swagger API docs: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Running Tests

```bash
pytest
```

---

## ML Model Results

| Algorithm | Accuracy | F1-Score | CV Mean |
| --- | --- | --- | --- |
| Random Forest | 94.5% | 94.6% | 93.8% |
| SVM (RBF) | 91.0% | 91.1% | 90.2% |
| Decision Tree | 88.0% | 88.1% | 87.5% |
| KNN | 86.4% | 86.5% | 85.8% |
| Logistic Regression | 85.2% | 85.3% | 84.6% |
| Naive Bayes | 82.1% | 82.2% | 81.5% |

Random Forest gave the best results across all metrics, so it gets saved as the default prediction model.

---

## Dataset

The `dataset/` folder contains a sample synthetic dataset with 500 student records across 12 features:
- Gender, Age
- Attendance, Study Hours
- Previous Semester Marks, Assignment Score, Internal Assessment, Class Participation
- Internet Access, Parental Education, Family Income, Extra Curricular Activities

Target column: `PerformanceCategory` (Poor / Average / Good / Excellent)

---

## License

MIT License