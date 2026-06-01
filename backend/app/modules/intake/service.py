from datetime import datetime
from sqlalchemy.orm import Session
from app.modules.intake.schemas import IntakeFormRequest, IntakeFormResponse
from app.modules.intake.models import Patient
from app.modules.intake.repository import PatientRepository
from app.modules.audit.repository import AuditRepository
from app.modules.ai.classifiers.urgency import UrgencyClassifier

class IntakeService:
    def __init__(self, db: Session):
        self.db = db
        self.patient_repo = PatientRepository(db)
        self.audit_repo = AuditRepository(db)

    def process_intake(self, request: IntakeFormRequest) -> IntakeFormResponse:
        """
        Validates form data, creates or updates patient, links insurance record,
        classifies urgency using AI, and registers audit entry.
        
        If a patient with the same email already exists, their record is updated
        rather than duplicated (handles resubmission gracefully).
        """
        dob = datetime.strptime(request.date_of_birth, "%Y-%m-%d").date()

        # Check if patient already exists by email
        existing_patient = self.patient_repo.get_by_email(request.email)

        if existing_patient:
            # Update existing patient record
            existing_patient.first_name = request.first_name
            existing_patient.last_name = request.last_name
            existing_patient.date_of_birth = dob
            existing_patient.phone = request.phone
            existing_patient.primary_diagnosis = request.primary_diagnosis
            existing_patient.patient_comments = request.patient_comments
            self.patient_repo.update(existing_patient)
            patient = existing_patient
        else:
            # Create new patient
            patient = Patient(
                first_name=request.first_name,
                last_name=request.last_name,
                date_of_birth=dob,
                email=request.email,
                phone=request.phone,
                primary_diagnosis=request.primary_diagnosis,
                patient_comments=request.patient_comments,
            )
            self.patient_repo.create(patient)

            # Create insurance record only for new patients
            self.patient_repo.add_insurance_record(
                patient_id=patient.id,
                provider_name=request.insurance_details.provider_name,
                policy_number=request.insurance_details.policy_number,
                group_number=request.insurance_details.group_number
            )

        # Synchronously classify clinical urgency level using AI (Claude → OpenAI fallback)
        urgency_level = "ROUTINE"
        reasoning = "Initial intake triage"
        try:
            classifier = UrgencyClassifier()
            notes = f"Primary Diagnosis: {patient.primary_diagnosis or 'Not specified'}."
            if patient.patient_comments:
                notes += f"\nPatient Comments: {patient.patient_comments}"
            res = classifier.classify(patient.id, notes)
            urgency_level = res.urgency_level.value
            reasoning = res.reasoning or reasoning

            # Update patient urgency level in DB
            patient.urgency_level = urgency_level
            self.patient_repo.update(patient)
        except Exception:
            pass

        # Write to immutable audit log
        self.audit_repo.append_only_insert(
            action="submit_intake",
            user_id="system",
            patient_id=patient.id,
            details={
                "urgency_level": urgency_level,
                "reasoning": reasoning
            }
        )

        return IntakeFormResponse(
            patient_id=patient.id,
            status="received",
            urgency_level=urgency_level,
            completeness_checked=False
        )
