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
    


class PredictionResponse(BaseModel):
    """
    Schema for single prediction result output.
    

    model_config = ConfigDict(from_attributes=True)


class BatchPredictionRequest(BaseModel):
    """
    Schema for batch prediction request.
    


class BatchPredictionResponse(BaseModel):
    """
    Schema for batch prediction results.
    


class PredictionHistoryResponse(BaseModel):
    """
    Schema for prediction history query response.
    
