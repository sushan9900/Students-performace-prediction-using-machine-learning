# Purpose of File: Defines Pydantic V2 input validation models for student features
#                   (Gender, Age, Attendance, Study Hours, Marks, Parental Education, etc.),
#                   single prediction requests, batch prediction payloads, and output schemas.
#
# Inputs        : Student demographic and academic attributes from frontend forms.
# Outputs       : Validated prediction requests and formatted prediction responses.
# Execution Flow:
#                 1. Validates numerical bounds (e.g. Attendance 0-100%, Study Hours 0-70).
#                 2. Enforces categorical enum checks (Gender, Internet Access, Income Level).
#                 3. Serializes machine learning classification predictions and confidence scores.
# ==============================================================================

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class StudentFeaturesInput(BaseModel):
    """
    Schema for individual student input features.
    
    Why it exists:
    --------------
    Defines the 12 core academic, demographic, and behavioral features required by the
    Machine Learning model to predict student performance.
    """
    gender: str = Field(default="Female", description="Gender: Female | Male | Other")
    age: int = Field(default=20, ge=15, le=40, description="Student age in years (15-40)")
    attendance: float = Field(default=85.0, ge=0.0, le=100.0, description="Attendance percentage (0-100%)")
    study_hours: float = Field(default=15.0, ge=0.0, le=70.0, description="Weekly study hours (0-70 hrs)")
    previous_semester_marks: float = Field(default=78.5, ge=0.0, le=100.0, description="Previous semester score (0-100%)")
    assignment_score: float = Field(default=82.0, ge=0.0, le=100.0, description="Average assignment score (0-100%)")
    internal_assessment: float = Field(default=80.0, ge=0.0, le=100.0, description="Internal assessment marks (0-100%)")
    class_participation: float = Field(default=75.0, ge=0.0, le=100.0, description="Class participation rating (0-100%)")
    internet_access: str = Field(default="Yes", description="Home internet access: Yes | No")
    parental_education: str = Field(default="Bachelor", description="Parental education level: High School | Associate | Bachelor | Master | Doctorate")
    family_income: str = Field(default="Medium", description="Family income level: Low | Medium | High")
    extra_curricular_activities: str = Field(default="Yes", description="Participation in extra curriculars: Yes | No")

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        valid_genders = ["Female", "Male", "Other"]
        clean_v = v.strip().capitalize()
        if clean_v not in valid_genders:
            return "Female"
        return clean_v

    @field_validator("internet_access", "extra_curricular_activities")
    @classmethod
    def validate_yes_no(cls, v: str) -> str:
        clean_v = v.strip().capitalize()
        if clean_v not in ["Yes", "No"]:
            return "Yes"
        return clean_v


class SinglePredictionRequest(BaseModel):
    """
    Schema for single student prediction HTTP request.
    
    Why it exists:
    --------------
    Accepts student details and optional target model selection for running real-time ML inference.
    """
    student_identifier: Optional[str] = Field(default="Student #1", description="Student Name or Roll Number")
    features: StudentFeaturesInput = Field(..., description="Student features for prediction")
    model_id: Optional[int] = Field(default=None, description="Specific model ID to use. Uses best model if None.")


class PredictionResponse(BaseModel):
    """
    Schema for single prediction result output.
    
    Why it exists:
    --------------
    Returns the predicted performance category (Excellent, Good, Average, Poor)
    and class confidence probability scores.
    """
    id: Optional[int] = Field(default=None, description="Prediction log record ID")
    student_identifier: str = Field(..., description="Student identifier")
    input_features: Dict[str, Any] = Field(..., description="Map of feature names to values submitted")
    predicted_category: str = Field(..., description="Predicted performance category: Excellent | Good | Average | Poor")
    confidence_probabilities: Dict[str, float] = Field(..., description="Confidence probability per category")
    model_used: str = Field(..., description="Name of Machine Learning model used for inference")
    created_at: str = Field(..., description="ISO formatted timestamp of prediction")

    model_config = ConfigDict(from_attributes=True)


class BatchPredictionRequest(BaseModel):
    """
    Schema for batch prediction request.
    
    Why it exists:
    --------------
    Allows predicting performance for multiple students simultaneously.
    """
    students: List[StudentFeaturesInput] = Field(..., description="List of student feature sets")
    model_id: Optional[int] = Field(default=None, description="Model ID to use for batch prediction")


class BatchPredictionResponse(BaseModel):
    """
    Schema for batch prediction results.
    
    Why it exists:
    --------------
    Delivers bulk prediction results and summary category counts.
    """
    total_students: int = Field(..., description="Total student records processed")
    category_counts: Dict[str, int] = Field(..., description="Distribution count of predicted performance categories")
    predictions: List[PredictionResponse] = Field(..., description="List of individual student prediction responses")


class PredictionHistoryResponse(BaseModel):
    """
    Schema for prediction history query response.
    
    Why it exists:
    --------------
    Returns historical predictions logged in the database for table display.
    """
    total_records: int = Field(..., description="Total prediction history log count")
    predictions: List[PredictionResponse] = Field(..., description="List of historical prediction records")
