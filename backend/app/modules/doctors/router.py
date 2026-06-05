from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.doctors.schemas import (
    DoctorCreateRequest, DoctorUpdateRequest, DoctorResponse,
    ScheduleCreateRequest, ScheduleResponse,
    DailyAvailabilityResponse, AppointmentResponse,
    TimeOffCreateRequest, TimeOffResponse,
    EmergencyBlockCreateRequest, EmergencyBlockResponse
)
from app.modules.doctors.service import DoctorService

router = APIRouter()
from pydantic import BaseModel

class BriefRequest(BaseModel):
    patient_name: str
    diagnosis: str
    clinical_history: str
    recent_labs: str
    imaging_reports: str

class PlanRequest(BaseModel):
    clinical_note: str
    appointment_id: Optional[int] = None

@router.post("/{patient_id}/generate-brief", status_code=status.HTTP_200_OK)
def generate_brief(patient_id: int, request: BriefRequest, db: Session = Depends(get_db)):
    """Trigger the PreConsultBriefAgent to synthesize patient data."""
    from app.modules.intake.models import OncologyIntake, Patient
    from app.workers.tasks.clinical_analysis import generate_pre_consult_brief
    import json
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    
    diagnosis = patient.primary_diagnosis if patient and patient.primary_diagnosis else request.diagnosis
    clinical_history = request.clinical_history
    imaging_reports = request.imaging_reports
    
    docs = []
    from app.modules.intake.models import UploadedDocument
    uploaded_docs = db.query(UploadedDocument).filter(UploadedDocument.patient_id == patient_id).all()
    
    for d in uploaded_docs:
        if d.extracted_text:
            docs.append(f"{d.document_type.value}:\n{d.extracted_text}")

    if intake:
        if intake.pathology_report and not uploaded_docs:
            docs.append("PATHOLOGY REPORT:\n" + (json.dumps(intake.pathology_report, indent=2) if isinstance(intake.pathology_report, dict) else str(intake.pathology_report)))
        if intake.referral_letter and not uploaded_docs:
            docs.append("REFERRAL LETTER:\n" + (json.dumps(intake.referral_letter, indent=2) if isinstance(intake.referral_letter, dict) else str(intake.referral_letter)))

    if docs:
        clinical_history = clinical_history + "\n\n--- UPLOADED DOCUMENTS ---\n" + "\n\n".join(docs)
        
    imaging_reports = "Standard Imaging"
    if intake and intake.imaging_report:
        imaging_reports = json.dumps(intake.imaging_report, indent=2) if isinstance(intake.imaging_report, dict) else str(intake.imaging_report)

    task = generate_pre_consult_brief.delay(
        patient_id, request.patient_name, diagnosis,
        clinical_history, request.recent_labs, imaging_reports
    )
    
    # In eager mode, we can get the result immediately
    summary = ""
    if hasattr(task, 'result') and isinstance(task.result, dict):
        parsed = task.result
        parts = []
        if parsed.get('chief_complaint'): parts.append(f"**Chief Complaint:** {parsed['chief_complaint']}")
        if parsed.get('history_summary'): parts.append(f"**History:** {parsed['history_summary']}")
        if parsed.get('recent_labs_summary'): parts.append(f"**Labs:** {parsed['recent_labs_summary']}")
        if parsed.get('imaging_summary'): parts.append(f"**Imaging:** {parsed['imaging_summary']}")
        if parsed.get('critical_alerts'): parts.append(f"**Critical Alerts:** {', '.join(parsed['critical_alerts'])}")
        summary = "\n\n".join(parts)
        from app.modules.intake.models import OncologyIntake
        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
        if intake:
            intake.ai_summary = summary
            db.commit()
            
    return {"status": "success", "task_id": task.id, "summary": summary}

@router.post("/{patient_id}/structure-plan", status_code=status.HTTP_200_OK)
def structure_plan(patient_id: int, request: PlanRequest, db: Session = Depends(get_db)):
    """Trigger the TreatmentPlanStructurer and MedicalCodingAgent."""
    from app.modules.intake.models import TreatmentPlan
    
    # Check if a DRAFT plan already exists for this appointment
    if request.appointment_id:
        existing_draft = db.query(TreatmentPlan).filter(
            TreatmentPlan.appointment_id == request.appointment_id,
            TreatmentPlan.status == "DRAFT"
        ).first()
        
        if existing_draft:
            # Reconstruct parsed_plan from DB to avoid AI re-run
            return {
                "message": "Draft plan retrieved",
                "coding_analysis": None,  # Can be cached later if needed
                "treatment_plan": {
                    "regimen_name": existing_draft.regimen_name,
                    "number_of_cycles": existing_draft.cycles,
                    "intent": "Curative", # Simplified for draft
                    "medications": [{"drug_name": existing_draft.description}]
                }
            }

    from app.modules.ai.classifiers.treatment_plan_structurer import TreatmentPlanStructurer
    structurer = TreatmentPlanStructurer()
    
    # Structure treatment plan synchronously so doctor can review
    parsed_plan = {}
    try:
        parsed_plan = structurer.structure_plan(patient_id, request.clinical_note)
        
        # Save as DRAFT in DB
        if parsed_plan and "treatment_plan" in parsed_plan:
            meds = parsed_plan["treatment_plan"].get("medications", [])
            med_str = ", ".join([f"{m.get('drug_name', '')} {m.get('dose_amount', '')}{m.get('dose_unit', '')}" for m in meds])
            
            draft_plan = TreatmentPlan(
                patient_id=patient_id,
                appointment_id=request.appointment_id,
                regimen_name=parsed_plan["treatment_plan"].get("regimen_name", "AI Suggested Regimen"),
                description=f"Intent: {parsed_plan['treatment_plan'].get('intent', 'unknown')}. Medications: {med_str}",
                cycles=parsed_plan["treatment_plan"].get("number_of_cycles", 6),
                status="DRAFT"
            )
            db.add(draft_plan)
            db.commit()
            
    except Exception as e:
        print(f"Error structuring plan: {e}")
    
    from app.modules.ai.classifiers.medical_coding import MedicalCodingAgent
    agent = MedicalCodingAgent()
    coding_result = agent.process_consultation(request.clinical_note)
    
    return {
        "status": "success", 
        "treatment_plan": parsed_plan,
        "coding_analysis": coding_result
    }


# ── Doctor CRUD ──────────────────────────────────────────────────

@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(request: DoctorCreateRequest, db: Session = Depends(get_db)):
    """Onboard a new doctor into the system."""
    service = DoctorService(db)
    return service.create_doctor(request)

from app.modules.users.auth_deps import get_current_active_user
from app.modules.users.models import User, VerificationStatus
from typing import Annotated

@router.post("/me/profile", status_code=status.HTTP_200_OK)
def update_doctor_profile(
    request: dict, # using dict for quick implementation since schema isn't fully defined
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Update doctor profile and set status to UNDER_REVIEW."""
    from app.modules.users.models import Role
    if current_user.role != Role.DOCTOR:
        raise HTTPException(status_code=403, detail="Not a doctor")
        
    current_user.verification_status = VerificationStatus.UNDER_REVIEW
    
    from app.modules.users.credential_models import StaffDocument, DocumentStatus, DocumentType
    
    # Delete old documents to prevent duplicates on re-upload
    db.query(StaffDocument).filter(StaffDocument.user_id == current_user.id).delete()
    
    if request.get("license_file"):
        doc1 = StaffDocument(
            user_id=current_user.id,
            document_type=DocumentType.MEDICAL_LICENSE,
            file_url=request.get("license_file"),
            status=DocumentStatus.PENDING_REVIEW
        )
        db.add(doc1)
        
    if request.get("board_file"):
        doc2 = StaffDocument(
            user_id=current_user.id,
            document_type=DocumentType.BOARD_CERTIFICATION,
            file_url=request.get("board_file"),
            status=DocumentStatus.PENDING_REVIEW
        )
        db.add(doc2)
        
    db.commit()
    return {"message": "Profile updated successfully, pending review"}

@router.get("", response_model=List[DoctorResponse])
def list_doctors(db: Session = Depends(get_db)):
    """List all onboarded doctors."""
    service = DoctorService(db)
    return service.get_all_doctors()


@router.get("/availability", response_model=DailyAvailabilityResponse)
def get_availability(date: str, db: Session = Depends(get_db)):
    """
    Get all doctors' availability for a given date.
    Query param: date=YYYY-MM-DD
    """
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    service = DoctorService(db)
    return service.get_availability_for_date(target_date)


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Get a single doctor by ID."""
    service = DoctorService(db)
    result = service.get_doctor(doctor_id)
    if not result:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return result


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, request: DoctorUpdateRequest, db: Session = Depends(get_db)):
    """Update a doctor's profile."""
    service = DoctorService(db)
    result = service.update_doctor(doctor_id, request)
    if not result:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return result


@router.get("/{doctor_id}/appointments", response_model=List[AppointmentResponse])
def get_doctor_appointments(doctor_id: int, q: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all patients/appointments assigned to a specific doctor. Optional search query."""
    service = DoctorService(db)
    return service.get_doctor_appointments(doctor_id, search_query=q)


# ── Schedule Management ──────────────────────────────────────────

@router.post("/{doctor_id}/schedule", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def add_schedule(doctor_id: int, request: ScheduleCreateRequest, db: Session = Depends(get_db)):
    """Assign a schedule block to a doctor."""
    service = DoctorService(db)
    result = service.add_schedule(doctor_id, request)
    if not result:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return result


@router.get("/{doctor_id}/schedule", response_model=List[ScheduleResponse])
def get_doctor_schedule(doctor_id: int, db: Session = Depends(get_db)):
    """Get a doctor's full weekly schedule."""
    service = DoctorService(db)
    return service.get_doctor_schedules(doctor_id)


@router.delete("/{doctor_id}/schedule/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_schedule(doctor_id: int, schedule_id: int, db: Session = Depends(get_db)):
    """Remove a schedule block from a doctor."""
    service = DoctorService(db)
    deleted = service.remove_schedule(doctor_id, schedule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Schedule not found")


# ── Time Off Management ──────────────────────────────────────────

@router.post("/{doctor_id}/time_off", response_model=TimeOffResponse, status_code=status.HTTP_201_CREATED)
def add_time_off(doctor_id: int, request: TimeOffCreateRequest, db: Session = Depends(get_db)):
    """Add a time-off block for a doctor."""
    service = DoctorService(db)
    return service.add_time_off(doctor_id, request)

@router.get("/{doctor_id}/time_off", response_model=List[TimeOffResponse])
def get_time_offs(doctor_id: int, db: Session = Depends(get_db)):
    """Get a doctor's time-off blocks."""
    service = DoctorService(db)
    return service.get_time_offs(doctor_id)

@router.delete("/{doctor_id}/time_off/{time_off_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_time_off(doctor_id: int, time_off_id: int, db: Session = Depends(get_db)):
    """Remove a time-off block."""
    service = DoctorService(db)
    deleted = service.remove_time_off(doctor_id, time_off_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Time off not found")


# ── Emergency Block Management ───────────────────────────────────

@router.post("/{doctor_id}/emergency_blocks", response_model=EmergencyBlockResponse, status_code=status.HTTP_201_CREATED)
def add_emergency_block(doctor_id: int, request: EmergencyBlockCreateRequest, db: Session = Depends(get_db)):
    """Add an emergency/reserved block for a doctor."""
    service = DoctorService(db)
    return service.add_emergency_block(doctor_id, request)

@router.get("/{doctor_id}/emergency_blocks", response_model=List[EmergencyBlockResponse])
def get_emergency_blocks(doctor_id: int, db: Session = Depends(get_db)):
    """Get a doctor's emergency blocks."""
    service = DoctorService(db)
    return service.get_emergency_blocks(doctor_id)

@router.delete("/{doctor_id}/emergency_blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_emergency_block(doctor_id: int, block_id: int, db: Session = Depends(get_db)):
    """Remove an emergency block."""
    service = DoctorService(db)
    deleted = service.remove_emergency_block(doctor_id, block_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Emergency block not found")
