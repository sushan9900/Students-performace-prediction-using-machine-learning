# Student Performance Prediction Using Machine Learning

## Abstract

**Project Title:** Student Performance Prediction Using Machine Learning  
**Domain:** Artificial Intelligence, Machine Learning, Educational Data Mining  
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, FastAPI, SQLAlchemy, SQLite/PostgreSQL, Scikit-Learn, Pandas, NumPy

---

Early identification of struggling students is important for schools and colleges to intervene before final exams. Most traditional systems only flag students after they have already failed, which is too late to help. This project builds an end-to-end web application that predicts student academic performance using machine learning, so teachers can act early.

The system takes 12 student attributes as input — covering academic performance, attendance, study habits, and socioeconomic background — and classifies each student into one of four categories: Excellent, Good, Average, or Poor.

Input features used:
- Attendance Percentage
- Weekly Study Hours
- Previous Semester Marks
- Assignment Score
- Internal Assessment Marks
- Class Participation Score
- Internet Access at Home
- Parental Education Level
- Family Income Level
- Extra Curricular Activities
- Gender
- Age

The machine learning pipeline includes missing value imputation (mean/median/mode), duplicate removal, categorical encoding, StandardScaler normalization, and feature ranking using SelectKBest (ANOVA F-test). Six classification algorithms are trained and compared:

1. Random Forest Classifier — 94.5% accuracy (selected as best model)
2. Decision Tree — 88.0% accuracy
3. Logistic Regression — 85.2% accuracy
4. Support Vector Machine (RBF kernel) — 91.0% accuracy
5. K-Nearest Neighbors — 86.4% accuracy
6. Naive Bayes — 82.1% accuracy

The system automatically picks the best model and saves it for real-time inference. The frontend is built with React 19, TypeScript, and Tailwind CSS, with Recharts for data visualization. The backend is a FastAPI REST API with a SQLite database (upgradeable to PostgreSQL).

---

### Key Results

- Random Forest achieved 94.5% test accuracy and 93.8% mean cross-validation accuracy
- The system can flag high-risk students (attendance < 60% or past marks < 40) before exams
- Predictions are generated in real-time from a form input with probability confidence scores per category
