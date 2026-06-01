from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.dependencies import get_db
from app.modules.intake.schemas import PatientRegistrationRequest, PatientRegistrationResponse
from app.modules.intake.models import Patient, InsuranceRecord, OncologyIntake

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

        # 2. Create Insurance Record
        new_insurance = InsuranceRecord(
            patient_id=new_patient.id,
            provider_name=request.insurance_details.provider_name,
            policy_number=request.insurance_details.policy_number,
            group_number=request.insurance_details.group_number
        )
        db.add(new_insurance)
        
        # 3. Create Oncology Intake Case
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
