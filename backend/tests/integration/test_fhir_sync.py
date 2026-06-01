import pytest
from unittest.mock import AsyncMock, patch
from app.modules.scheduling.models import Appointment
from app.workers.tasks.fhir_sync import async_write_appointment_to_aria

@patch("app.fhir.writer.FHIRWriter.write_appointment", new_callable=AsyncMock)
def test_fhir_sync_task_integration(mock_write, db_session):
    mock_write.return_value = "fhir-id-999"

    # Setup database appointment
    from datetime import datetime
    appointment = Appointment(
        patient_id=1,
        start_time=datetime(2026, 6, 2, 10, 0),
        end_time=datetime(2026, 6, 2, 11, 0),
        status="confirmed",
        specialty="oncology"
    )
    db_session.add(appointment)
    db_session.commit()

    # Stub SessionLocal inside task to return our test db session
    with patch("app.workers.tasks.fhir_sync.SessionLocal", return_value=db_session):
        success = async_write_appointment_to_aria(appointment.id)
        
        assert success is True
        
        # Verify db updated with fhir_id
        appointment_db = db_session.query(Appointment).filter(Appointment.id == appointment.id).first()
        assert appointment_db.fhir_id == "fhir-id-999"
        mock_write.assert_called_once()
