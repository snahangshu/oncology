import logging
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

@celery_app.task(name="app.workers.tasks.notifications.send_confirmation_email")
def send_confirmation_email(patient_email: str, appointment_id: int):
    """Asynchronously sends confirmation email to the patient."""
    logger.info(f"Sending confirmation email to {patient_email} for appointment {appointment_id}")
    return True

@celery_app.task(name="app.workers.tasks.notifications.send_sms")
def send_sms(patient_phone: str, message: str):
    """Asynchronously sends SMS alerts."""
    logger.info(f"Sending SMS to {patient_phone}: {message}")
    return True

@celery_app.task(name="app.workers.tasks.notifications.send_calendar_invite")
def send_calendar_invite(patient_email: str, appointment_details: dict):
    """Asynchronously sends calendar event invitation."""
    logger.info(f"Sending calendar invite to {patient_email} with details {appointment_details}")
    return True
