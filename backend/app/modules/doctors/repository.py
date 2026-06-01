from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from app.shared.base_repository import BaseRepository
from app.modules.doctors.models import Doctor, DoctorSchedule


class DoctorRepository(BaseRepository[Doctor]):
    def __init__(self, db: Session):
        super().__init__(Doctor, db)

    def get_by_email(self, email: str) -> Optional[Doctor]:
        return self.db.query(self.model).filter(self.model.email == email).first()

    def get_active_doctors(self) -> List[Doctor]:
        return self.db.query(self.model).filter(self.model.status == "active").all()


class DoctorScheduleRepository(BaseRepository[DoctorSchedule]):
    def __init__(self, db: Session):
        super().__init__(DoctorSchedule, db)

    def get_by_doctor_id(self, doctor_id: int) -> List[DoctorSchedule]:
        return (
            self.db.query(self.model)
            .filter(self.model.doctor_id == doctor_id)
            .order_by(self.model.day_of_week, self.model.start_time)
            .all()
        )

    def get_schedules_for_day(self, day_of_week: int, specific_date: Optional[date] = None) -> List[DoctorSchedule]:
        """
        Get all schedule blocks for a given day of week.
        Also includes any one-off overrides for the specific date.
        """
        query = self.db.query(self.model).filter(
            (self.model.day_of_week == day_of_week) & (self.model.is_recurring == True)
        )
        
        if specific_date:
            one_off_query = self.db.query(self.model).filter(
                self.model.specific_date == specific_date
            )
            # Combine recurring + one-off
            return query.all() + one_off_query.all()
        
        return query.all()

    def delete_by_id_and_doctor(self, schedule_id: int, doctor_id: int) -> bool:
        schedule = (
            self.db.query(self.model)
            .filter(self.model.id == schedule_id, self.model.doctor_id == doctor_id)
            .first()
        )
        if schedule:
            self.db.delete(schedule)
            self.db.commit()
            return True
        return False
