# Machine Learning Workflow

## Project: Student Performance Prediction Using Machine Learning

---

## Feature Engineering

Before training, a few derived features are added:

- **total_academic_score** = (0.40 × past_marks) + (0.30 × assignment_score) + (0.30 × internal_assessment)
- **attendance_study_interaction** = (attendance / 100) × study_hours
- **academic_risk_flag** = 1 if attendance < 60 or past_marks < 40, else 0

---

## Data Preprocessing Steps

1. **Missing value imputation** — mean for numeric columns, mode for categorical
2. **Duplicate removal** — exact duplicate rows dropped
3. **Categorical encoding** — text values mapped to integers using fixed mappings:
   - Gender: Female=0, Male=1, Other=2
   - Parental Education: High School=0, Associate=1, Bachelor=2, Master=3, Doctorate=4
   - Family Income: Low=0, Medium=1, High=2
   - Internet Access / Extra Curricular: No=0, Yes=1
4. **Feature scaling** — StandardScaler applied to numeric features (zero mean, unit variance):

   z = (x - μ) / σ

5. **Train/test split** — 80/20 split with stratification when possible

---

## Algorithms and Configuration

| Algorithm | Class | Key Parameters |
|---|---|---|
| Random Forest | `RandomForestClassifier` | n_estimators=100, max_depth=10 |
| Decision Tree | `DecisionTreeClassifier` | max_depth=6 |
| Logistic Regression | `LogisticRegression` | max_iter=1000, C=1.0 |
| SVM | `SVC` | kernel='rbf', C=1.0, probability=True |
| KNN | `KNeighborsClassifier` | n_neighbors=5 |
| Naive Bayes | `GaussianNB` | default |

---

## Evaluation Metrics

Each model is evaluated on:
- **Accuracy** = (TP + TN) / (TP + TN + FP + FN)
- **Precision** = TP / (TP + FP)  (weighted average)
- **Recall** = TP / (TP + FN)  (weighted average)
- **F1-Score** = 2 × (Precision × Recall) / (Precision + Recall)
- **5-Fold Cross Validation** mean and standard deviation

---

## Model Lifecycle

```
CSV uploaded
    |
    v
Clean (impute missing values, drop duplicates)
    |
    v
Encode (categorical -> int, target -> 0-3)
    |
    v
Scale (StandardScaler fit on X_train, transform X_test)
    |
    v
Train 6 classifiers
    |
    v
Evaluate each on test set + 5-fold CV
    |
    v
Pick best model by accuracy
    |
    v
Save all models as .joblib files
Save best as models/best_model.joblib
```

---

## Feature Importance

For tree-based models (Random Forest, Decision Tree), importance is taken directly from `feature_importances_`. For linear models (Logistic Regression, SVM), it uses normalized coefficient magnitudes. For KNN and Naive Bayes, equal weights are assigned since they don't expose importances.

The top features found in testing were: `previous_semester_marks`, `attendance`, `total_academic_score`, and `study_hours`.
