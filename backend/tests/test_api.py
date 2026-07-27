# Purpose of File: Automated Pytest test suite for validating backend REST API
#                   endpoints (/dataset/upload, /ml/train, /predict/single, /dashboard/stats).
#
# Execution Command: pytest backend/tests/test_api.py
# ==============================================================================

import os
import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_health_check():
    """Tests the root health check endpoint GET /."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Online & Operational"
    assert "Student Performance Prediction" in data["system"]


def test_dashboard_stats_endpoint():
    """Tests the dashboard statistics API endpoint GET /api/v1/dashboard/stats."""
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "summary_cards" in data
    assert "performance_distribution" in data
    assert "model_comparison" in data


def test_dataset_upload_endpoint():
    """Tests CSV file upload API endpoint POST /api/v1/dataset/upload."""
    csv_content = (
        "Gender,Age,Attendance,Study Hours,Previous Semester Marks,Assignment Score,"
        "Internal Assessment,Class Participation,Internet Access,Parental Education,"
        "Family Income,Extra Curricular Activities,PerformanceCategory\n"
        "Female,20,92.5,22.5,88.0,91.0,89.5,90.0,Yes,Bachelor,Medium,Yes,Excellent\n"
        "Male,21,85.0,18.0,76.5,80.0,78.0,82.0,Yes,High School,Low,No,Good\n"
    )
    
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))
    
    response = client.post(
        "/api/v1/dataset/upload",
        files={"file": ("test_students.csv", file_bytes, "text/csv")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test_students.csv"
    assert data["row_count"] == 2
    assert data["column_count"] == 13


def test_predict_single_endpoint():
    """Tests single student performance prediction API endpoint POST /api/v1/predict/single."""
    payload = {
        "student_identifier": "Test Student #101",
        "features": {
            "gender": "Female",
            "age": 20,
            "attendance": 90.0,
            "study_hours": 20.0,
            "previous_semester_marks": 85.0,
            "assignment_score": 88.0,
            "internal_assessment": 86.0,
            "class_participation": 88.0,
            "internet_access": "Yes",
            "parental_education": "Bachelor",
            "family_income": "Medium",
            "extra_curricular_activities": "Yes"
        }
    }

    response = client.post("/api/v1/predict/single", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["student_identifier"] == "Test Student #101"
    assert data["predicted_category"] in ["Excellent", "Good", "Average", "Poor"]
    assert "confidence_probabilities" in data
