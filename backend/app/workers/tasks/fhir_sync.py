import asyncio
import logging
from app.workers.celery_app import celery_app
from app.fhir.writer import FHIRWriter
from app.dependencies import SessionLocal
from app.modules.scheduling.repository import AppointmentRepository

logger = logging.getLogger(__name__)

async def _write_appointment_task(appointment_id: int):
    db = SessionLocal()
    try:
        repo = AppointmentRepository(db)
        appointment = repo.get(appointment_id)
        if not appointment:
            logger.error(f"Appointment {appointment_id} not found for FHIR sync.")
            return False

        writer = FHIRWriter()
        fhir_id = await writer.write_appointment(appointment)

        # Update appointment record in database with FHIR reference
        appointment.fhir_id = fhir_id
        repo.update(appointment)
        return True
    finally:
        db.close()

async def _write_infusion_task(schedule_details: dict):
    writer = FHIRWriter()
    fhir_id = await writer.write_infusion_schedule(schedule_details)
    logger.info(f"Successfully synchronised infusion schedule. FHIR ID: {fhir_id}")
    return fhir_id

@celery_app.task(name="app.workers.tasks.fhir_sync.async_write_appointment_to_aria")
def async_write_appointment_to_aria(appointment_id: int):
    """
    Asynchronous worker task to synchronize local appointments to Varian ARIA.
    """
    return asyncio.run(_write_appointment_task(appointment_id))

@celery_app.task(name="app.workers.tasks.fhir_sync.async_write_infusion_schedule")
def async_write_infusion_schedule(schedule_details: dict):
    """
    Asynchronous worker task to synchronize infusion schedules to Varian ARIA.
    """
    return asyncio.run(_write_infusion_task(schedule_details))
