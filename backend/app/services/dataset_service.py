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
    
    Why it exists:
    --------------
    Implements Clean Architecture by decoupling dataset management business logic from
    FastAPI HTTP routing endpoints in app/routers/dataset.py.
    """

    def upload_dataset(self, file: UploadFile, db: Session) -> DatasetModel:
        """
        Processes and stores an uploaded CSV dataset file and registers it in the database.
        
        Why it exists:
        --------------
        Validates file format, saves file safely to disk, parses schema headers,
        and creates a persistent dataset record.
        
        Inputs : file (UploadFile): FastAPI file object.
                 db (Session): SQLAlchemy database session.
        Outputs: DatasetModel: Persistent database entity instance.
        """
        # 1. Save file to disk with sanitized timestamp name
        original_name, saved_path = save_uploaded_file(file)

        # 2. Read CSV to inspect dimensions and column headers
        df = read_csv_to_dataframe(saved_path)
        row_count = len(df)
        col_count = len(df.columns)
        columns_list = list(df.columns)
        file_size = saved_path.stat().st_size

        # 3. Create database record
        db_dataset = DatasetModel(
            filename=original_name,
            file_path=saved_path.as_posix(),
            row_count=row_count,
            column_count=col_count,
            columns_list=columns_list,
            file_size_bytes=file_size,
            is_active=True
        )

        db.add(db_dataset)
        db.commit()
        db.refresh(db_dataset)

        return db_dataset

    def get_dataset_by_id(self, dataset_id: int, db: Session) -> DatasetModel:
        """
        Retrieves a dataset database record by primary key ID.
        
        Inputs : dataset_id (int): Dataset ID.
                 db (Session): Database session.
        Outputs: DatasetModel: Database ORM record.
        """
        dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset with ID {dataset_id} not found."
            )
        return dataset

    def get_active_dataset(self, db: Session) -> DatasetModel:
        """
        Retrieves the most recently uploaded active dataset record.
        
        Inputs : db (Session): Database session.
        Outputs: DatasetModel: Active dataset record.
        """
        dataset = db.query(DatasetModel).filter(DatasetModel.is_active == True).order_by(DatasetModel.id.desc()).first()
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active student dataset found. Please upload a dataset first."
            )
        return dataset

    def preview_dataset(self, dataset_id: int, db: Session) -> DatasetPreviewResponse:
        """
        Generates comprehensive dataset statistics and sample rows for UI table preview.
        
        Why it exists:
        --------------
        Powers the frontend Dataset Overview dashboard with sample data, missing value breakdowns,
        data types, and numerical metrics (mean, std, min, max).
        
        Inputs : dataset_id (int): Dataset ID.
                 db (Session): Database session.
        Outputs: DatasetPreviewResponse: Formatted Pydantic preview response.
        """
        dataset = self.get_dataset_by_id(dataset_id, db)
        df = read_csv_to_dataframe(dataset.file_path)

        # 1. Sample rows (First 10 records)
        sample_rows = df.head(10).fillna("").to_dict(orient="records")

        # 2. Missing value counts per column
        missing_counts = {col: int(df[col].isnull().sum()) for col in df.columns}

        # 3. Duplicate row count
        duplicate_count = int(df.duplicated().sum())

        # 4. Inferred data types
        data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}

        # 5. Numerical columns summary (mean, std, min, 25%, 50%, 75%, max)
        num_summary = {}
        num_df = df.select_dtypes(include=["number"])
        if not num_df.empty:
            desc = num_df.describe().round(2).to_dict()
            for col, metrics in desc.items():
                num_summary[col] = {k: float(v) for k, v in metrics.items()}

        return DatasetPreviewResponse(
            filename=dataset.filename,
            row_count=len(df),
            column_count=len(df.columns),
            columns=list(df.columns),
            sample_rows=sample_rows,
            missing_values=missing_counts,
            duplicate_count=duplicate_count,
            data_types=data_types,
            numerical_summary=num_summary
        )

    def validate_dataset(self, dataset_id: int, db: Session) -> DatasetValidationResponse:
        """
        Validates CSV structure and column headers against student feature schemas.
        
        Inputs : dataset_id (int): Dataset ID.
                 db (Session): Database session.
        Outputs: DatasetValidationResponse: Validation diagnostic summary.
        """
        dataset = self.get_dataset_by_id(dataset_id, db)
        df = read_csv_to_dataframe(dataset.file_path)

        is_valid, messages, col_mapping = validate_dataset_schema(df)
        health_info = check_dataset_health(df)

        return DatasetValidationResponse(
            is_valid=is_valid,
            filename=dataset.filename,
            total_rows=health_info["total_rows"],
            total_columns=health_info["total_columns"],
            missing_value_total=health_info["missing_cells_total"],
            duplicate_rows=health_info["duplicate_rows"],
            validation_messages=messages if messages else ["Dataset schema is fully valid and healthy."]
        )

    def clean_dataset(
        self, 
        dataset_id: int, 
        req: DatasetCleaningRequest, 
        db: Session
    ) -> DatasetCleaningResponse:
        """
        Executes missing value imputation and duplicate removal on a stored CSV dataset.
        
        Inputs : dataset_id (int): Target dataset ID.
                 req (DatasetCleaningRequest): Cleaning strategy parameters.
                 db (Session): Database session.
        Outputs: DatasetCleaningResponse: Summary of cleaning execution.
        """
        dataset = self.get_dataset_by_id(dataset_id, db)
        df = read_csv_to_dataframe(dataset.file_path)

        preprocessor = DataPreprocessor()
        df_clean, logs = preprocessor.clean_dataset(
            df=df,
            missing_strategy=req.missing_value_strategy,
            remove_duplicates=req.remove_duplicates
        )

        # Overwrite file with cleaned content
        df_clean.to_csv(dataset.file_path, index=False)

        # Update database metadata record
        dataset.row_count = len(df_clean)
        db.commit()

        return DatasetCleaningResponse(
            message="Dataset cleaned and saved successfully.",
            original_row_count=logs["initial_rows"],
            cleaned_row_count=logs["final_rows"],
            rows_removed=logs["duplicates_removed"],
            imputed_columns=logs["imputed_columns"]
        )
