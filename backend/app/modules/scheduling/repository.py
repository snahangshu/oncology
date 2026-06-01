from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
from app.shared.base_repository import BaseRepository
from app.modules.scheduling.models import Appointment, SlotAvailability

class AppointmentRepository(BaseRepository[Appointment]):
    def __init__(self, db: Session):
        super().__init__(Appointment, db)

    def get_by_patient_id(self, patient_id: int) -> List[Appointment]:
        return self.db.query(self.model).filter(self.model.patient_id == patient_id).all()

    def get_available_slots(self, start_time: datetime, end_time: datetime) -> List[SlotAvailability]:
        return self.db.query(SlotAvailability).filter(
            SlotAvailability.start_time >= start_time,
            SlotAvailability.end_time <= end_time,
            SlotAvailability.is_booked == False
        ).all()

    def book_slot(self, slot_id: int) -> bool:
        slot = self.db.query(SlotAvailability).filter(SlotAvailability.id == slot_id).first()
        if slot and not slot.is_booked:
            slot.is_booked = True
            self.db.commit()
            return True
        return False
