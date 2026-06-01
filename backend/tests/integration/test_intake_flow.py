import pytest
from app.modules.intake.schemas import IntakeFormRequest, InsuranceDetailsSchema
from app.modules.intake.service import IntakeService
from app.modules.intake.models import Patient
from app.modules.audit.models import AuditEntry

def test_intake_flow_integration(db_session):
    # Setup request schema
    req = IntakeFormRequest(
        first_name="Jane",
        last_name="Doe",
        date_of_birth="1985-05-15",
        email="jane.doe@example.com",
        phone="555-0199",
        primary_diagnosis="Breast Cancer Stage II",
        insurance_details=InsuranceDetailsSchema(
            provider_name="Health Insurance Corp",
            policy_number="POL-9988-ABC"
        )
    )

    service = IntakeService(db_session)
    res = service.process_intake(req)

    assert res.patient_id is not None
    assert res.urgency_level is not None

    # Verify patient was written to DB
    patient = db_session.query(Patient).filter(Patient.id == res.patient_id).first()
    assert patient is not None
    assert patient.first_name == "Jane"
    assert patient.email == "jane.doe@example.com"

    # Verify audit entry was written
    audit = db_session.query(AuditEntry).filter(AuditEntry.patient_id == patient.id).first()
    assert audit is not None
    assert audit.action == "submit_intake"
