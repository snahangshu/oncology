import pytest
from datetime import datetime, timedelta
from app.modules.intake.models import Patient
from app.modules.scheduling.models import SlotAvailability
from app.modules.scheduling.service import SchedulingService
from app.modules.infusion.service import InfusionService
from app.modules.scheduling.schemas import SlotQuery, SlotConfirmRequest
from app.modules.infusion.schemas import OverrideRequest

def test_infusion_scheduling_and_override_integration(db_session):
    # 1. Create a dummy patient
    patient = Patient(
        first_name="John",
        last_name="Smith",
        date_of_birth=datetime(1975, 4, 10).date(),
        email="john.smith@example.com",
        phone="555-0244",
        urgency_level="ROUTINE"
    )
    db_session.add(patient)
    db_session.commit()

    # 2. Add slot availability
    start = datetime.utcnow() + timedelta(days=2)
    slot = SlotAvailability(
        start_time=start,
        end_time=start + timedelta(hours=1),
        chair_id=1,
        nurse_id=2,
        is_booked=False
    )
    db_session.add(slot)
    db_session.commit()

    # 3. Query & Confirm Slot
    sched_service = SchedulingService(db_session)
    slots = sched_service.get_scored_slots(SlotQuery(patient_id=patient.id, specialty="oncology", preferred_start_date=start, preferred_end_date=start + timedelta(hours=1)))
    
    # Confirm
    confirm_req = SlotConfirmRequest(
        patient_id=patient.id,
        slot_id=str(slot.id),
        start_time=start,
        end_time=start + timedelta(hours=1)
    )
    confirm_res = sched_service.confirm_slot(confirm_req)
    assert confirm_res.status == "confirmed"

    # 4. Trigger override on same slot (should detect conflict)
    infusion_service = InfusionService(db_session)
    override_req = OverrideRequest(
        patient_id=patient.id,
        chair_id=1,
        nurse_id=2,
        start_time=start,
        end_time=start + timedelta(hours=1),
        justification="Clinician priority demand override."
    )
    # Since we booked it, chair assignment isn't created automatically by confirm_slot (only the appointment is confirmed).
    # Let's create an overlapping chair assignment directly to test the conflict explainer
    infusion_service.infusion_repo.create_chair_assignment(
        schedule_id=123, chair_id=1, start_time=start, end_time=start + timedelta(hours=1)
    )

    override_res = infusion_service.apply_override(override_req)
    assert override_res.success is False
    assert override_res.conflict_detected is True
    assert override_res.conflict_description is not None
