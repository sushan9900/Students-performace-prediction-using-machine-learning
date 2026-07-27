# Purpose of File: FastAPI HTTP API router defining endpoints for CSV dataset uploads,
#                   data previews, schema validations, active dataset queries, and auto-cleaning.
#
# Inputs        : HTTP POST/GET requests with multipart CSV files or dataset IDs.
# Outputs       : Validated JSON API responses for dataset metadata, preview, and validation.
# Execution Flow:
#                 1. Receives incoming HTTP requests at /api/v1/dataset/*.
#                 2. Injects database session dependency (get_db).
#                 3. Delegates business logic execution to DatasetService.
#                 4. Handles exceptions cleanly and returns formatted JSON payloads.
# ==============================================================================

from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dataset import (
    DatasetMetadataResponse,
    DatasetPreviewResponse,
    DatasetValidationResponse,
    DatasetCleaningRequest,
    DatasetCleaningResponse
)
from app.services.dataset_service import DatasetService


router = APIRouter(prefix="/dataset", tags=["Dataset Management API"])
dataset_service = DatasetService()


@router.post(
    "/upload", 
    response_model=DatasetMetadataResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Upload Student CSV Dataset",
    description="Uploads a CSV file containing student academic features, validates format, and saves metadata."
)
def upload_dataset(
    file: UploadFile = File(..., description="Student Performance CSV file"),
    db: Session = Depends(get_db)
) -> DatasetMetadataResponse:
    """
    HTTP POST /api/v1/dataset/upload
    


@router.get(
    "/preview/{dataset_id}",
    response_model=DatasetPreviewResponse,
    summary="Preview Dataset Content",
    description="Returns sample rows, missing value distribution, duplicate counts, and numerical summaries."
)
def preview_dataset(
    dataset_id: int,
    db: Session = Depends(get_db)
) -> DatasetPreviewResponse:
    """
    HTTP GET /api/v1/dataset/preview/{dataset_id}
    """
    return dataset_service.preview_dataset(dataset_id, db)


@router.get(
    "/validate/{dataset_id}",
    response_model=DatasetValidationResponse,
    summary="Validate Dataset Schema",
    description="Checks CSV headers for required student feature columns and target variables."
)
def validate_dataset(
    dataset_id: int,
    db: Session = Depends(get_db)
) -> DatasetValidationResponse:
    """
    HTTP GET /api/v1/dataset/validate/{dataset_id}
    """
    return dataset_service.validate_dataset(dataset_id, db)


@router.post(
    "/clean/{dataset_id}",
    response_model=DatasetCleaningResponse,
    summary="Auto-Clean Dataset",
    description="Imputes missing values and removes duplicate rows according to specified strategy."
)
def clean_dataset(
    dataset_id: int,
    cleaning_req: DatasetCleaningRequest,
    db: Session = Depends(get_db)
) -> DatasetCleaningResponse:
    """
    HTTP POST /api/v1/dataset/clean/{dataset_id}
    """
    return dataset_service.clean_dataset(dataset_id, cleaning_req, db)


@router.get(
    "/active",
    response_model=DatasetMetadataResponse,
    summary="Get Active Dataset",
    description="Retrieves the currently selected active dataset details."
)
def get_active_dataset(
    db: Session = Depends(get_db)
) -> DatasetMetadataResponse:
    """
    HTTP GET /api/v1/dataset/active
    """
    dataset = dataset_service.get_active_dataset(db)
    return DatasetMetadataResponse(
        id=dataset.id,
        filename=dataset.filename,
        file_path=dataset.file_path,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        columns_list=dataset.columns_list,
        file_size_bytes=dataset.file_size_bytes,
        uploaded_at=dataset.uploaded_at.isoformat(),
        is_active=dataset.is_active
    )
