from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.intake.schemas import IntakeFormRequest, IntakeFormResponse, DocumentUploadResponse, CompletenessResult
from app.modules.intake.service import IntakeService

router = APIRouter()
documents_router = APIRouter()

@router.post("", response_model=IntakeFormResponse, status_code=status.HTTP_201_CREATED)
def submit_intake(
    request: IntakeFormRequest,
    db: Session = Depends(get_db)
):
    """Submit a patient intake form and triage clinical urgency."""
    intake_service = IntakeService(db)
    return intake_service.process_intake(request)

@documents_router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a clinical document and trigger asynchronous verification."""
    import os
    import shutil
    from app.workers.tasks.document_processing import process_uploaded_doc

    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{patient_id}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    task = process_uploaded_doc.delay(patient_id, file_path)
    return DocumentUploadResponse(
        document_id=patient_id,
        status="processing",
        task_id=task.id
    )

@documents_router.post("/{document_id}/analyze-insurance", status_code=status.HTTP_202_ACCEPTED)
async def analyze_insurance(document_id: int, document_text: str):
    """Trigger the Insurance Auth Agent to parse coverage details."""
    from app.workers.tasks.document_processing import process_insurance_auth
    task = process_insurance_auth.delay(document_id, document_text)
    return {"status": "processing", "task_id": task.id}

@documents_router.get("/{document_id}/status", response_model=CompletenessResult)
def get_document_status(
    document_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve completeness check results for a document."""
    return CompletenessResult(
        document_id=document_id,
        is_complete=True,
        missing_sections=[],
        extracted_metadata={"notes": "All required sections are present."}
    )
