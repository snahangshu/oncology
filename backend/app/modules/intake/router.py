from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import cloudinary.uploader

from app.dependencies import get_db
from app.modules.intake.schemas import OncologyIntakeSchema
from app.modules.intake.models import OncologyIntake, Patient

router = APIRouter()
documents_router = APIRouter()

def recalculate_status(intake: OncologyIntake):
    total_required = 4
    uploaded_count = 0
    if intake.referral_letter: uploaded_count += 1
    if intake.pathology_report: uploaded_count += 1
    if intake.imaging_report: uploaded_count += 1
    if intake.insurance_authorization: uploaded_count += 1

    intake.completion_percentage = int((uploaded_count / total_required) * 100)
    intake.intake_status = "COMPLETE" if uploaded_count == total_required else "INCOMPLETE"

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
    db: Session = Depends(get_db)
):
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    if not intake:
        raise HTTPException(status_code=404, detail="Intake case not found")

    valid_types = ["referral_letter", "pathology_report", "imaging_report", "insurance_authorization"]
    if document_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid document_type. Must be one of {valid_types}")

    # Read file data
    contents = await file.read()
    
    try:
        # Stream buffer directly to Cloudinary
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

    # Dynamically assign metadata to the correct JSON column
    setattr(intake, document_type, doc_metadata)
    
    # Auto-calculate completeness
    recalculate_status(intake)
    db.commit()
    db.refresh(intake)

    return {"message": f"{document_type} uploaded successfully", "intake": intake}

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
