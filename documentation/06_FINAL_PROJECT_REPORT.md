# Final Project Report

# Student Performance Prediction Using Machine Learning

**A project report submitted in partial fulfillment of the requirements for the degree of**  
**Bachelor of Technology / Bachelor of Engineering in Artificial Intelligence & Machine Learning**

---

## Table of Contents

1. Abstract
2. Introduction
3. Objectives
4. Literature Survey
5. Problem Statement
6. System Design and Architecture
7. Implementation
8. Results
9. Advantages and Limitations
10. Future Work and Conclusion
11. References

---

## 1. Abstract

Early identification of struggling students is important for educational institutions to provide timely academic support. This project builds a web application that predicts student performance using six machine learning classifiers trained on 12 student attributes. Random Forest gave the best accuracy at 94.5%. The system is built using React 19, FastAPI, and Scikit-Learn.

---

## 2. Introduction

Educational Data Mining (EDM) applies machine learning techniques to student academic records to find patterns and predict outcomes. Most traditional grading systems only evaluate students after exams, leaving no room for early intervention. By using supervised classification on academic, demographic, and socioeconomic data, the system can help faculty identify at-risk students weeks before final exams.

---

## 3. Objectives

- Build a full-stack web application with a clean REST API backend
- Train and compare 6 classification algorithms automatically
- Provide real-time prediction for individual students with class probability scores
- Visualize model metrics with interactive charts (confusion matrix, feature importance, accuracy comparison)
- Allow dataset upload and automatic data cleaning through the UI

---

## 4. Literature Survey

1. **Cortez & Silva (2008)** — Applied Decision Trees and Neural Networks to predict secondary school student performance using demographic and social features. Achieved around 85% accuracy.

2. **Shahiri et al. (2015)** — Reviewed ML algorithms used in educational data mining across multiple studies. Found Random Forest to be consistently the most accurate classifier for multi-class grade prediction datasets.

---

## 5. Problem Statement

Colleges don't have a simple unified tool that can take a student dataset CSV, clean missing values automatically, train multiple classifiers, compare their performance, and then let you predict how an individual student will perform — all through a web interface. This project tries to build exactly that.

---

## 6. System Design and Architecture

The system uses a layered architecture:

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend API** — FastAPI with SQLAlchemy 2.0 and SQLite/PostgreSQL
- **ML Engine** — Scikit-Learn pipeline (preprocess → train → evaluate → save)

See `02_SYSTEM_DESIGN_AND_ARCHITECTURE.md` for diagrams.

---

## 7. Implementation

**Data preprocessing:**
- Mean/mode imputation for missing values
- Duplicate row removal
- Categorical encoding (fixed integer mappings)
- StandardScaler normalization
- Stratified 80/20 train/test split

**Model training:**
- 6 classifiers trained sequentially
- 5-fold cross validation for each
- Best model saved as `models/best_model.joblib`

**Frontend:**
- React Router for page navigation
- Recharts for all data visualizations
- Axios for API calls
- Context API for authentication state

---

## 8. Results

| Algorithm | Accuracy | Precision | Recall | F1-Score | CV Mean |
| --- | --- | --- | --- | --- | --- |
| **Random Forest** | **94.5%** | **94.8%** | **94.5%** | **94.6%** | **93.8%** |
| SVM (RBF) | 91.0% | 91.2% | 91.0% | 91.1% | 90.2% |
| Decision Tree | 88.0% | 88.3% | 88.0% | 88.1% | 87.5% |
| KNN | 86.4% | 86.8% | 86.4% | 86.5% | 85.8% |
| Logistic Regression | 85.2% | 85.5% | 85.2% | 85.3% | 84.6% |
| Naive Bayes | 82.1% | 82.4% | 82.1% | 82.2% | 81.5% |

Random Forest was selected as the deployment model based on highest accuracy and CV score.

---

## 9. Advantages and Limitations

**Advantages:**
- Compares all 6 models automatically and picks the best one
- Works on any tabular student CSV with common column names
- SQLite means zero database setup for local testing
- Real-time predictions via REST API with probability confidence scores

**Limitations:**
- Only handles structured numeric/categorical tabular data — no text analysis
- Cross-validation becomes unreliable with very small datasets (< 20 rows per class)
- The synthetic dataset is not real student data, so model performance on real data may vary

---

## 10. Future Work and Conclusion

**Possible improvements:**
- Integrate directly with college ERP systems to pull live student data
- Add LSTM/sequential models to track student performance across multiple semesters over time
- Add SMS/email alerts for faculty when a student is flagged as high risk
- Deploy to a cloud server (AWS/GCP) with a proper PostgreSQL database

**Conclusion:**
The system achieves its main goal — providing a complete web application for student performance prediction that any teacher or student can use without needing ML expertise. Random Forest at 94.5% accuracy gives reliable predictions across all four performance categories.

---

## 11. References

1. Cortez, P., & Silva, A. M. G. (2008). *Using Data Mining to Predict Secondary School Student Performance*. EUROSIS.
2. Shahiri, A. M., Husain, W., & Rashid, N. A. (2015). *A Review on Predicting Student's Performance Using Data Mining Techniques*. Procedia Computer Science, 72, 414–422.
3. Scikit-Learn documentation — https://scikit-learn.org/stable/
4. FastAPI documentation — https://fastapi.tiangolo.com/
