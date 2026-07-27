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
    

    model_config = ConfigDict(from_attributes=True)


class DatasetPreviewResponse(BaseModel):
    """
    Schema for detailed dataset preview API endpoint.
    


class DatasetValidationResponse(BaseModel):
    """
    Schema for CSV dataset validation feedback.
    


class DatasetCleaningRequest(BaseModel):
    """
    Schema for requesting dataset preprocessing and auto-cleaning.
    


class DatasetCleaningResponse(BaseModel):
    """
    Schema for reporting dataset auto-cleaning results.
    
