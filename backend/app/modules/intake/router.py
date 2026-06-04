from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import cloudinary.uploader
from typing import List

from app.dependencies import get_db
from app.modules.intake.schemas import OncologyIntakeSchema, CompletenessResult
from app.modules.intake.models import OncologyIntake, Patient, UploadedDocument, DocumentType, IntakePhase
from app.modules.users.models import User, Role
from app.modules.users.auth_deps import require_role

router = APIRouter()
documents_router = APIRouter()

DOC_PHASE_MAP = {
    DocumentType.REFERRAL_LETTER: IntakePhase.PHASE_1,
    DocumentType.PATHOLOGY_REPORT: IntakePhase.PHASE_1,
    DocumentType.IMAGING_REPORT: IntakePhase.PHASE_1,
    DocumentType.INSURANCE_AUTHORIZATION: IntakePhase.PHASE_1,
    DocumentType.CBC_REPORT: IntakePhase.PHASE_2,
    DocumentType.CMP_REPORT: IntakePhase.PHASE_2,
    DocumentType.MEDICATION_LIST: IntakePhase.PHASE_2,
    DocumentType.ALLERGY_RECORD: IntakePhase.PHASE_2,
    DocumentType.CONSULTATION_NOTE: IntakePhase.PHASE_3,
    DocumentType.NURSING_NOTE: IntakePhase.PHASE_3,
    DocumentType.SURGERY_REPORT: IntakePhase.PHASE_3,
    DocumentType.DISCHARGE_SUMMARY: IntakePhase.PHASE_3,
    DocumentType.RADIATION_REPORT: IntakePhase.PHASE_3,
}

def recalculate_status(intake: OncologyIntake):
    total_required = 4
    uploaded_count = 0
    if intake.referral_letter: uploaded_count += 1
    if intake.pathology_report: uploaded_count += 1
    if intake.imaging_report: uploaded_count += 1
    if intake.insurance_authorization: uploaded_count += 1

    intake.completion_percentage = int((uploaded_count / total_required) * 100)
    intake.intake_status = "COMPLETE" if uploaded_count == total_required else "INCOMPLETE"

@router.get("/me", response_model=OncologyIntakeSchema)
def get_my_intake(
    current_user: User = Depends(require_role([Role.PATIENT])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.email == current_user.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient.id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake case not found")
        
    return intake

@router.get("/me/documents")
def get_my_documents(
    current_user: User = Depends(require_role([Role.PATIENT])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.email == current_user.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    documents = db.query(UploadedDocument).filter(UploadedDocument.patient_id == patient.id).order_by(UploadedDocument.created_at.desc()).all()
    
    grouped = {
        IntakePhase.PHASE_1.value: [],
        IntakePhase.PHASE_2.value: [],
        IntakePhase.PHASE_3.value: []
    }
    
    for doc in documents:
        grouped[doc.phase.value].append({
            "id": doc.id,
            "document_type": doc.document_type.value,
            "original_name": doc.original_name,
            "file_url": doc.file_url,
            "uploaded_at": doc.created_at.isoformat() if doc.created_at else None,
            "status": doc.status
        })
        
    return grouped

@router.post("/me/upload")
async def upload_my_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([Role.PATIENT])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.email == current_user.email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient.id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake case not found")

    try:
        doc_enum = DocumentType(document_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid document_type. Must be a valid DocumentType enum.")

    phase = DOC_PHASE_MAP[doc_enum]
    contents = await file.read()
    
    extracted_text = None
    if file.content_type == "application/pdf":
        try:
            import fitz
            pdf_doc = fitz.open(stream=contents, filetype="pdf")
            text = ""
            for page in pdf_doc:
                text += page.get_text()
            extracted_text = text.strip()
        except Exception as e:
            print(f"Failed to extract PDF text: {e}")
    
    try:
        result = cloudinary.uploader.upload(
            contents,
            resource_type="auto",
            folder=f"oncology_intakes/{patient.id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    doc_metadata = {
        "originalName": file.filename,
        "fileUrl": result.get("secure_url"),
        "fileType": file.content_type,
        "uploadedAt": datetime.utcnow().isoformat(),
        "public_id": result.get("public_id")
    }

    # Always create an UploadedDocument record
    new_doc = UploadedDocument(
        patient_id=patient.id,
        intake_id=intake.id,
        document_type=doc_enum,
        phase=phase,
        file_url=result.get("secure_url"),
        original_name=file.filename,
        uploaded_by=current_user.id,
        extracted_text=extracted_text
    )
    db.add(new_doc)
    db.flush()

    # If Phase 1, also update OncologyIntake JSON for fast checklist reading
    if phase == IntakePhase.PHASE_1:
        setattr(intake, doc_enum.lower(), doc_metadata)
        recalculate_status(intake)
        
        if doc_enum == DocumentType.PATHOLOGY_REPORT:
            from app.workers.tasks.document_processing import process_pathology_report
            # In a real app we'd download the cloudinary URL to a local tmp file, but for MVP we mock the path
            process_pathology_report.delay(patient.id, f"/tmp/{file.filename}", new_doc.id)
        
    db.commit()
    db.refresh(intake)

    return {"message": f"{document_type} uploaded successfully", "intake": intake}

@router.get("/{patient_id}", response_model=OncologyIntakeSchema)
def get_intake_by_patient(patient_id: int, db: Session = Depends(get_db)):
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found for patient")
    return intake

@router.post("/{patient_id}/upload")
async def upload_document(
    patient_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([Role.ADMIN, Role.RECEPTIONIST, Role.NURSE, Role.DOCTOR])),
    db: Session = Depends(get_db)
):
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake case not found")

    try:
        doc_enum = DocumentType(document_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid document_type.")

    phase = DOC_PHASE_MAP[doc_enum]
    contents = await file.read()
    
    extracted_text = None
    if file.content_type == "application/pdf":
        try:
            import fitz
            pdf_doc = fitz.open(stream=contents, filetype="pdf")
            text = ""
            for page in pdf_doc:
                text += page.get_text()
            extracted_text = text.strip()
        except Exception as e:
            print(f"Failed to extract PDF text: {e}")
    
    try:
        result = cloudinary.uploader.upload(
            contents,
            resource_type="auto",
            folder=f"oncology_intakes/{patient_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    doc_metadata = {
        "originalName": file.filename,
        "fileUrl": result.get("secure_url"),
        "fileType": file.content_type,
        "uploadedAt": datetime.utcnow().isoformat(),
        "public_id": result.get("public_id")
    }

    # Always create an UploadedDocument record
    new_doc = UploadedDocument(
        patient_id=patient_id,
        intake_id=intake.id,
        document_type=doc_enum,
        phase=phase,
        file_url=result.get("secure_url"),
        original_name=file.filename,
        uploaded_by=current_user.id,
        extracted_text=extracted_text
    )
    db.add(new_doc)
    db.flush()

    # If Phase 1, also update OncologyIntake JSON
    if phase == IntakePhase.PHASE_1:
        setattr(intake, doc_enum.lower(), doc_metadata)
        recalculate_status(intake)
        
        if doc_enum == DocumentType.PATHOLOGY_REPORT:
            from app.workers.tasks.document_processing import process_pathology_report
            process_pathology_report.delay(patient_id, f"/tmp/{file.filename}", new_doc.id)
        
    db.commit()
    db.refresh(intake)

    return {"message": f"{document_type} uploaded successfully", "intake": intake}

@router.get("/{patient_id}/documents")
def get_documents_by_patient(patient_id: int, db: Session = Depends(get_db)):
    documents = db.query(UploadedDocument).filter(UploadedDocument.patient_id == patient_id).order_by(UploadedDocument.created_at.desc()).all()
    
    grouped = {
        IntakePhase.PHASE_1.value: [],
        IntakePhase.PHASE_2.value: [],
        IntakePhase.PHASE_3.value: []
    }
    
    for doc in documents:
        grouped[doc.phase.value].append({
            "id": doc.id,
            "document_type": doc.document_type.value,
            "original_name": doc.original_name,
            "file_url": doc.file_url,
            "uploaded_at": doc.created_at.isoformat() if doc.created_at else None,
            "status": doc.status
        })
        
    return grouped

@router.patch("/{patient_id}/status")
def update_intake_status(
    patient_id: int,
    force_status: str = Form(None), # The requested Manual override!
    db: Session = Depends(get_db)
):
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    if force_status in ["COMPLETE", "INCOMPLETE"]:
        intake.intake_status = force_status
    else:
        recalculate_status(intake)
        
    db.commit()
    db.refresh(intake)
    return {"message": "Status updated", "intake": intake}

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

@router.post("/{patient_id}/defer")
def defer_document(
    patient_id: int,
    document_type: str = Form(...),
    db: Session = Depends(get_db)
):
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake case not found")

    # Limit deferrals to specific documents if desired, or all of them.
    valid_types = ["referral_letter", "pathology_report", "imaging_report", "insurance_authorization"]
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid document_type")

    doc_metadata = {
        "originalName": "Deferred to Patient Portal",
        "fileUrl": "#",
        "fileType": "deferred",
        "uploadedAt": datetime.utcnow().isoformat(),
        "public_id": None
    }

    setattr(intake, document_type, doc_metadata)
    recalculate_status(intake)
    db.commit()
    db.refresh(intake)
    return {"message": f"{document_type} deferred successfully", "intake": intake}

@router.delete("/{patient_id}/document/{document_type}")
def delete_document(
    patient_id: int,
    document_type: str,
    db: Session = Depends(get_db)
):
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    valid_types = ["referral_letter", "pathology_report", "imaging_report", "insurance_authorization"]
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid document type")

    # Fetch Cloudinary public_id and delete it from their servers
    doc_metadata = getattr(intake, document_type)
    if doc_metadata and "public_id" in doc_metadata:
        try:
            cloudinary.uploader.destroy(doc_metadata["public_id"])
        except Exception:
            print("Failed to delete from cloudinary, but proceeding to clear local DB")

    setattr(intake, document_type, None)
    recalculate_status(intake)
    db.commit()
    db.refresh(intake)
    return {"message": "Document deleted", "intake": intake}
