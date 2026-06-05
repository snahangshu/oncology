from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.intake.models import TreatmentCycle, Patient
import time

router = APIRouter()

@router.post("/cycle/{cycle_id}/upload-labs")
def upload_labs(cycle_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    cycle = db.query(TreatmentCycle).filter(TreatmentCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
        
    # In a real system, save the file to S3/GCS. For now, mark as uploaded.
    cycle.labs_uploaded = True
    db.commit()
    
    return {"status": "success", "message": "Labs uploaded successfully"}

@router.post("/cycle/{cycle_id}/ai-fit-check")
def ai_fit_check(cycle_id: int, db: Session = Depends(get_db)):
    cycle = db.query(TreatmentCycle).filter(TreatmentCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
        
    if not cycle.labs_uploaded:
        raise HTTPException(status_code=400, detail="Must upload labs first")
        
    # Simulate OCR Extraction
    # In reality, this would call an LLM with the uploaded PDF
    time.sleep(1) # Simulate AI processing time
    
    # Mocking successful extraction of ANC > 1500 and Platelets > 100k
    extracted_data = {
        "WBC": 6.2,
        "ANC": 3200,
        "Platelets": 185000,
        "Hemoglobin": 11.5,
        "Creatinine": 0.9,
        "is_fit_for_chemo": True
    }
    
    if extracted_data["is_fit_for_chemo"]:
        cycle.ai_fit_check_passed = True
        db.commit()
        return {"status": "success", "message": "AI Fit-Check passed", "data": extracted_data}
    else:
        return {"status": "error", "message": "AI Fit-Check failed: Patient neutropenic", "data": extracted_data}

@router.post("/cycle/{cycle_id}/pharmacy-auth")
def pharmacy_auth(cycle_id: int, db: Session = Depends(get_db)):
    cycle = db.query(TreatmentCycle).filter(TreatmentCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
        
    if not cycle.ai_fit_check_passed:
        raise HTTPException(status_code=400, detail="Cannot auth vials until AI Fit-Check passes")
        
    cycle.pharmacy_vials_approved = True
    cycle.ready_for_booking = True
    db.commit()
    
    return {"status": "success", "message": "Pharmacy authorized vials. Slot booking unlocked."}
