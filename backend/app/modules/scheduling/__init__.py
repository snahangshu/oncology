# Scheduling domain module
from app.modules.scheduling.models import Appointment, SlotAvailability
from app.modules.scheduling.schemas import SlotQuery, SlotOption, SlotConfirmRequest, SlotConfirmResponse
from app.modules.scheduling.repository import AppointmentRepository
from app.modules.scheduling.service import SchedulingService
from app.modules.scheduling.router import router

__all__ = [
    "Appointment",
    "SlotAvailability",
    "SlotQuery",
    "SlotOption",
    "SlotConfirmRequest",
    "SlotConfirmResponse",
    "AppointmentRepository",
    "SchedulingService",
    "router",
]
