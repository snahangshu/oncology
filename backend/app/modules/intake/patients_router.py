from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.dependencies import get_db
from app.modules.intake.schemas import PatientRegistrationRequest, PatientRegistrationResponse
from app.modules.intake.models import Patient, InsuranceRecord, OncologyIntake
from app.modules.users.models import User, Role
from app.modules.users.security import pwd_context

router = APIRouter()

@router.post("", response_model=PatientRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    request: PatientRegistrationRequest,
    db: Session = Depends(get_db)
):
    """Register a new patient and create their oncology intake profile."""
    
    # Check if patient already exists
    existing = db.query(Patient).filter(Patient.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient with this email already exists")

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User account with this email already exists")

    try:
        # 1. Create Patient
        dob_parsed = datetime.strptime(request.date_of_birth, "%Y-%m-%d").date()
        
        new_patient = Patient(
            first_name=request.first_name,
            last_name=request.last_name,
            date_of_birth=dob_parsed,
            gender=request.gender,
            email=request.email,
            phone=request.phone,
            address=request.address
        )
        db.add(new_patient)
        db.flush() # Flush to get new_patient.id

        # 2. Create User login for Patient Portal
        new_user = User(
            email=request.email,
            hashed_password=pwd_context.hash("password123"), # Default password
            full_name=f"{request.first_name} {request.last_name}",
            role=Role.PATIENT
        )
        db.add(new_user)

        # 3. Create Insurance Record
        new_insurance = InsuranceRecord(
            patient_id=new_patient.id,
            provider_name=request.insurance_details.provider_name,
            policy_number=request.insurance_details.policy_number,
            group_number=request.insurance_details.group_number
        )
        db.add(new_insurance)
        
        # 4. Create Oncology Intake Case
        new_intake = OncologyIntake(
            patient_id=new_patient.id,
            intake_status="INCOMPLETE",
            completion_percentage=0
        )
        db.add(new_intake)

        db.commit()

        return PatientRegistrationResponse(
            patient_id=new_patient.id,
            message="Patient and intake case successfully created."
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from app.modules.intake.models import UploadedDocument, IntakePhase, DocumentType
from app.modules.scheduling.models import Appointment

@router.get("/{patient_id}/dashboard")
def get_patient_dashboard(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    insurance = db.query(InsuranceRecord).filter(InsuranceRecord.patient_id == patient_id).all()
    intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
    documents = db.query(UploadedDocument).filter(UploadedDocument.patient_id == patient_id).all()
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).all()

    # 1. Timeline Events Generation
    timeline = []
    
    if intake:
        timeline.append({
            "id": f"intake_created_{intake.id}",
            "eventType": "INTAKE_CREATED",
            "title": "Oncology Intake Created",
            "description": "Patient intake case initiated.",
            "createdAt": intake.created_at.isoformat() if intake.created_at else None
        })
        if intake.intake_status == "COMPLETE":
            timeline.append({
                "id": f"intake_completed_{intake.id}",
                "eventType": "INTAKE_COMPLETED",
                "title": "Intake Completed",
                "description": "All mandatory Phase 1 documents have been provided.",
                "createdAt": intake.updated_at.isoformat() if intake.updated_at else None
            })

    for doc in documents:
        timeline.append({
            "id": f"doc_{doc.id}",
            "eventType": "DOCUMENT_UPLOAD",
            "title": f"{doc.document_type.value.replace('_', ' ').title()} Uploaded",
            "description": f"File '{doc.original_name}' was uploaded into the system.",
            "createdAt": doc.created_at.isoformat() if doc.created_at else None
        })

    for appt in appointments:
        timeline.append({
            "id": f"appt_{appt.id}",
            "eventType": "APPOINTMENT_CREATED",
            "title": f"Appointment Scheduled",
            "description": f"Scheduled for {appt.start_time.isoformat() if appt.start_time else 'Unknown'}.",
            "createdAt": appt.created_at.isoformat() if appt.created_at else None
        })

    # Sort timeline descending (newest first)
    timeline.sort(key=lambda x: x["createdAt"] or "", reverse=True)

    # 2. Documents grouped by phase
    grouped_docs = {
        IntakePhase.PHASE_1.value: [],
        IntakePhase.PHASE_2.value: [],
        IntakePhase.PHASE_3.value: []
    }
    for doc in documents:
        grouped_docs[doc.phase.value].append({
            "id": doc.id,
            "document_type": doc.document_type.value,
            "original_name": doc.original_name,
            "file_url": doc.file_url,
            "uploaded_at": doc.created_at.isoformat() if doc.created_at else None,
            "status": doc.status
        })
    # Sort docs within groups
    for phase in grouped_docs:
        grouped_docs[phase].sort(key=lambda x: x["uploaded_at"] or "", reverse=True)

    # 3. Check for specific document uploads to calculate alerts
    has_pathology = any(d.document_type == DocumentType.PATHOLOGY_REPORT for d in documents)
    has_imaging = any(d.document_type == DocumentType.IMAGING_REPORT for d in documents)
    has_insurance = any(d.document_type == DocumentType.INSURANCE_AUTHORIZATION for d in documents)
    
    cbc_reports = [d for d in documents if d.document_type == DocumentType.CBC_REPORT]
    cmp_reports = [d for d in documents if d.document_type == DocumentType.CMP_REPORT]
    
    now = datetime.utcnow()
    def is_older_than_30_days(doc_list):
        if not doc_list: return False
        latest = max(doc_list, key=lambda x: x.created_at or datetime.min)
        if not latest.created_at: return False
        return (now - latest.created_at).days > 30

    cbc_old = is_older_than_30_days(cbc_reports)
    cmp_old = is_older_than_30_days(cmp_reports)

    alerts = []
    if not has_pathology: alerts.append("Missing Pathology Report")
    if not has_imaging: alerts.append("Missing Imaging Report")
    if not has_insurance: alerts.append("Insurance Authorization Pending")
    if intake and intake.intake_status != "COMPLETE": alerts.append("Intake Incomplete")
    if len([a for a in appointments if a.start_time and a.start_time > now]) == 0: alerts.append("No Upcoming Appointment")
    if cbc_old: alerts.append("CBC older than 30 days")
    if cmp_old: alerts.append("CMP older than 30 days")

    # 4. Clinical Snapshot
    # Attempt to find the assigned oncologist (from future appointments or history)
    assigned_oncologist = "Unassigned"
    if appointments:
        # Simplistic approach: grab doctor from latest appointment
        latest_appt = max(appointments, key=lambda x: x.start_time or datetime.min)
        # Assumes Appointment has a doctor_id and we have a Doctor relation, but since we don't have it explicitly fetched here,
        # we'll mock the name format or pull from appointment object if it exposes doctor details
        assigned_oncologist = f"Dr. ID {latest_appt.doctor_id}" if hasattr(latest_appt, 'doctor_id') else "Dr. Smith"

    # Mocking Cancer Type / Treatment Status until DB fields exist
    cancer_type = patient.primary_diagnosis if patient.primary_diagnosis else "Pending Diagnosis"
    
    snapshot = {
        "primaryDiagnosis": patient.primary_diagnosis,
        "cancerType": cancer_type,
        "currentTreatmentStatus": "Intake & Evaluation" if intake and intake.intake_status != "COMPLETE" else "Active Treatment",
        "assignedOncologist": assigned_oncologist,
        "urgencyLevel": patient.urgency_level or "NORMAL"
    }

    # Format Appointments for frontend
    formatted_appointments = []
    for appt in appointments:
        formatted_appointments.append({
            "id": appt.id,
            "status": appt.status,
            "start_time": appt.start_time.isoformat() if appt.start_time else None,
            "end_time": appt.end_time.isoformat() if appt.end_time else None,
            "type": appt.appointment_type if hasattr(appt, 'appointment_type') else "Consultation"
        })

    return {
        "patient": {
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "gender": patient.gender,
            "email": patient.email,
            "phone": patient.phone,
            "address": patient.address
        },
        "snapshot": snapshot,
        "insurance": [
            {
                "id": ins.id,
                "provider_name": ins.provider_name,
                "policy_number": ins.policy_number,
                "group_number": ins.group_number
            } for ins in insurance
        ],
        "intake": {
            "id": intake.id if intake else None,
            "status": intake.intake_status if intake else "NOT_STARTED",
            "completion_percentage": intake.completion_percentage if intake else 0
        },
        "documents": grouped_docs,
        "appointments": formatted_appointments,
        "timeline": timeline,
        "alerts": alerts,
        "aiSummary": {
            "intakeSummary": None,
            "preConsultBrief": None,
            "drugSafetyAssessment": None,
            "toxicityAssessment": None
        }
    }
