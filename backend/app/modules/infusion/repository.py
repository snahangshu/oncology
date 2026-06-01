from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.shared.base_repository import BaseRepository
from app.modules.infusion.models import InfusionSchedule, ChairAssignment, NurseAssignment

class InfusionRepository(BaseRepository[InfusionSchedule]):
    def __init__(self, db: Session):
        super().__init__(InfusionSchedule, db)

    def get_by_patient_id(self, patient_id: int) -> List[InfusionSchedule]:
        return self.db.query(self.model).filter(self.model.patient_id == patient_id).all()

    def get_by_appointment_id(self, appointment_id: int) -> Optional[InfusionSchedule]:
        return self.db.query(self.model).filter(self.model.appointment_id == appointment_id).first()

    def create_chair_assignment(
        self, schedule_id: int, chair_id: int, start_time: datetime, end_time: datetime
    ) -> ChairAssignment:
        assignment = ChairAssignment(
            schedule_id=schedule_id,
            chair_id=chair_id,
            start_time=start_time,
            end_time=end_time
        )
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def create_nurse_assignment(
        self, schedule_id: int, nurse_id: int, start_time: datetime, end_time: datetime
    ) -> NurseAssignment:
        assignment = NurseAssignment(
            schedule_id=schedule_id,
            nurse_id=nurse_id,
            start_time=start_time,
            end_time=end_time
        )
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def check_chair_conflicts(self, chair_id: int, start_time: datetime, end_time: datetime) -> List[ChairAssignment]:
        return self.db.query(ChairAssignment).filter(
            ChairAssignment.chair_id == chair_id,
            ChairAssignment.start_time < end_time,
            ChairAssignment.end_time > start_time
        ).all()
