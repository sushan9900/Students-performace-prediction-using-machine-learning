# Purpose of File: Provides reusable helper functions for CSV file upload validation,
#                   sanitized disk saving, pandas dataframe loading, and safe deletion.
#
# Inputs        : FastAPI UploadFile objects, file paths, or byte buffers.
# Outputs       : Validated file paths, pandas DataFrames, or boolean status flags.
# Execution Flow:
#                 1. Inspects uploaded file extensions and content size bounds.
#                 2. Sanitizes filenames with unique ISO timestamps to avoid name collisions.
#                 3. Loads raw CSV data securely into Pandas DataFrames for downstream processing.
# ==============================================================================

import os
from pathlib import Path
from datetime import datetime
from typing import Tuple, Union
import pandas as pd
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


def validate_csv_file(file: UploadFile) -> None:
    """
    Validates that an uploaded file is a valid non-empty CSV file within size limits.
    

    # 2. File Size Validation
    file.file.seek(0, os.SEEK_END)
    file_size_bytes = file.file.tell()
    file.file.seek(0)  # Reset pointer to beginning

    if file_size_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes). Please upload a valid student dataset CSV."
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )


def save_uploaded_file(file: UploadFile) -> Tuple[str, Path]:
    """
    Saves an uploaded CSV file to the dataset directory with a sanitized, timestamped name.
    

    original_filename = file.filename or "student_data.csv"
    clean_base_name = Path(original_filename).stem.replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{clean_base_name}_{timestamp}.csv"
    
    target_path = settings.UPLOAD_DIR / unique_filename

    # Save file to disk
    with open(target_path, "wb") as buffer:
        buffer.write(file.file.read())

    return original_filename, target_path


def read_csv_to_dataframe(file_path: Union[Path, str]) -> pd.DataFrame:
    """
    Reads a CSV dataset from local storage into a Pandas DataFrame.
    

    try:
        df = pd.read_csv(path_obj)
        # Strip leading/trailing whitespace from string headers
        df.columns = [str(col).strip() for col in df.columns]
        
        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dataset contains no rows/data records."
            )
            
        return df

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV dataset. Error: {str(e)}"
        )


def delete_file_safely(file_path: Union[Path, str]) -> bool:
    """
    Safely deletes a file from disk without throwing uncaught exceptions.
    
