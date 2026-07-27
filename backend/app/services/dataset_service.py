# Purpose of File: Business logic layer for managing dataset operations including CSV
#                   file storage, database model persistence, dataset preview generation,
#                   missing value calculation, schema validation, and auto-cleaning.
#
# Inputs        : UploadFile objects, dataset IDs, database sessions, and cleaning requests.
# Outputs       : Dataset metadata records, preview statistics dicts, and validation responses.
# Execution Flow:
#                 1. Saves raw CSV uploads using file_handler utilities.
#                 2. Stores file metadata (row count, columns, file size) into PostgreSQL/SQLite via ORM.
#                 3. Computes statistical summaries (mean, std, missing cell counts, sample rows) for frontend UI.
#                 4. Preprocesses and auto-cleans datasets according to requested strategies.
# ==============================================================================

import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status

from app.database.models import DatasetModel
from app.schemas.dataset import (
    DatasetMetadataResponse,
    DatasetPreviewResponse,
    DatasetValidationResponse,
    DatasetCleaningRequest,
    DatasetCleaningResponse
)
from app.utils.file_handler import save_uploaded_file, read_csv_to_dataframe
from app.utils.validators import validate_dataset_schema, check_dataset_health
from app.ml.preprocessor import DataPreprocessor


class DatasetService:
    """
    Dataset Service Class.
    

    def upload_dataset(self, file: UploadFile, db: Session) -> DatasetModel:
        """
        Processes and stores an uploaded CSV dataset file and registers it in the database.
