# Purpose of File: Defines Pydantic V2 data structures and validation schemas
#                   for dataset uploads, file previews, missing value statistics,
#                   cleaning options, and API response payloads.
#
# Inputs        : HTTP JSON payloads, file upload meta, or pandas metadata dicts.
# Outputs       : Validated Pydantic models for request body deserialization & response serialization.
# Execution Flow:
#                 1. Validates incoming data against type definitions and ranges.
#                 2. Serializes Python dicts into clean, formatted JSON HTTP responses.
# ==============================================================================

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class DatasetMetadataResponse(BaseModel):
    """
    Schema for dataset metadata API responses.
    
    Why it exists:
    --------------
    Provides basic summary information about an uploaded CSV dataset stored in the system.
    """
    id: int = Field(..., description="Unique dataset primary key ID")
    filename: str = Field(..., description="Name of the uploaded CSV file")
    file_path: str = Field(..., description="Server disk path where dataset is stored")
    row_count: int = Field(..., description="Total number of student rows/records")
    column_count: int = Field(..., description="Total number of feature columns")
    columns_list: List[str] = Field(..., description="List of all column header names")
    file_size_bytes: int = Field(..., description="File size in bytes")
    uploaded_at: str = Field(..., description="ISO formatted upload timestamp")
    is_active: bool = Field(True, description="Whether dataset is active")

    model_config = ConfigDict(from_attributes=True)


class DatasetPreviewResponse(BaseModel):
    """
    Schema for detailed dataset preview API endpoint.
    
    Why it exists:
    --------------
    Allows the frontend to render interactive data tables, missing value indicators,
    and statistical summaries (mean, min, max, std) before ML model training.
    """
    filename: str = Field(..., description="Dataset name")
    row_count: int = Field(..., description="Total row count")
    column_count: int = Field(..., description="Total column count")
    columns: List[str] = Field(..., description="Column names")
    sample_rows: List[Dict[str, Any]] = Field(..., description="First 10 rows of dataset for UI table preview")
    missing_values: Dict[str, int] = Field(..., description="Missing value count per column")
    duplicate_count: int = Field(..., description="Number of exact duplicate rows detected")
    data_types: Dict[str, str] = Field(..., description="Inferred Pandas data type per column")
    numerical_summary: Optional[Dict[str, Dict[str, float]]] = Field(
        default=None, 
        description="Statistical metrics (mean, std, min, 25%, 50%, 75%, max) for numeric columns"
    )


class DatasetValidationResponse(BaseModel):
    """
    Schema for CSV dataset validation feedback.
    
    Why it exists:
    --------------
    Informs users whether their uploaded CSV meets the required schema format
    (e.g., student performance features present, valid non-empty rows).
    """
    is_valid: bool = Field(..., description="True if dataset is structurally valid for ML training")
    filename: str = Field(..., description="Dataset name")
    total_rows: int = Field(..., description="Total row count")
    total_columns: int = Field(..., description="Total column count")
    missing_value_total: int = Field(..., description="Total missing values across all cells")
    duplicate_rows: int = Field(..., description="Count of duplicate records")
    validation_messages: List[str] = Field(..., description="List of warning or error messages")


class DatasetCleaningRequest(BaseModel):
    """
    Schema for requesting dataset preprocessing and auto-cleaning.
    
    Why it exists:
    --------------
    Allows frontend users to specify how to handle dataset anomalies (e.g. imbalanced rows,
    missing values imputation, and duplicate removal).
    """
    missing_value_strategy: str = Field(
        default="mean", 
        description="Strategy for missing values: 'mean' | 'median' | 'mode' | 'drop'"
    )
    remove_duplicates: bool = Field(default=True, description="Whether to drop identical duplicate rows")
    scale_features: bool = Field(default=True, description="Whether to apply standard feature scaling")


class DatasetCleaningResponse(BaseModel):
    """
    Schema for reporting dataset auto-cleaning results.
    
    Why it exists:
    --------------
    Provides feedback on rows removed, imputed columns, and cleaned shape.
    """
    message: str = Field(..., description="Status summary message")
    original_row_count: int = Field(..., description="Row count before cleaning")
    cleaned_row_count: int = Field(..., description="Row count after cleaning")
    rows_removed: int = Field(..., description="Number of rows dropped during cleaning")
    imputed_columns: List[str] = Field(..., description="Columns where missing values were filled")
