from typing import List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.modules.scheduling.schemas import SlotQuery, SlotOption, SlotConfirmRequest, SlotConfirmResponse
from app.modules.scheduling.models import Appointment
from app.modules.scheduling.repository import AppointmentRepository
from app.modules.audit.repository import AuditRepository
from app.modules.ai.slot_scorer.scorer import SlotScorer

class SchedulingService:
    def __init__(self, db: Session):
        self.db = db
        self.appointment_repo = AppointmentRepository(db)
        self.audit_repo = AuditRepository(db)

    def get_scored_slots(self, query: SlotQuery) -> List[SlotOption]:
        """
        Query database for available doctors in the requested specialty,
        run them through AI SlotScorer, and return them sorted by score.
        """
        start = query.preferred_start_date or datetime.utcnow()
        end = query.preferred_end_date or (start + timedelta(days=7))

        # We will use DoctorService to find available doctors for the next 7 days
        from app.modules.doctors.service import DoctorService
        doc_service = DoctorService(self.db)
        
        scorer = SlotScorer()
        options = []
        
        # Check availability for the next few days
        current_date = start.date()
        end_date = end.date()
        
        slot_id_counter = 1
        
        while current_date <= end_date:
            avail = doc_service.get_availability_for_date(current_date)
            for slot in avail.slots:
                # Only suggest doctors matching the requested specialty and not booked
                if slot.specialty.lower() == query.specialty.lower() and not slot.is_booked:
                    slot_start = datetime.strptime(slot.start_time, "%H:%M").time()
                    slot_end = datetime.strptime(slot.end_time, "%H:%M").time()
                    
                    full_start = datetime.combine(current_date, slot_start)
                    full_end = datetime.combine(current_date, slot_end)
                    
                    # Score it
                    score, reasoning = scorer.score_slot(query.patient_id, full_start, query.specialty)
                    
                    options.append(
                        SlotOption(
                            slot_id=f"doc_slot_{slot_id_counter}",
                            doctor_id=slot.doctor_id,
                            doctor_name=slot.doctor_name,
                            start_time=full_start,
                            end_time=full_end,
                            score=score,
                            reasoning=reasoning
                        )
                    )
                    slot_id_counter += 1
            current_date += timedelta(days=1)

        options.sort(key=lambda x: x.score, reverse=True)
        return options[:3]

    def confirm_slot(self, request: SlotConfirmRequest) -> SlotConfirmResponse:
        """
        Confirms a chosen appointment slot, updates database,
        triggers async FHIR synchronization, and records audit trail.
        """
        appointment = Appointment(
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            start_time=request.start_time,
            end_time=request.end_time,
            status="confirmed",
            specialty="oncology"
        )
        self.appointment_repo.create(appointment)

        # We no longer book 'chairs' in the initial consult scheduling,
        # so we can skip the SlotAvailability update here.

        from app.workers.tasks.fhir_sync import async_write_appointment_to_aria
        task = async_write_appointment_to_aria.delay(appointment.id)

        # Write to append-only audit log
        self.audit_repo.append_only_insert(
            action="confirm_slot",
            user_id="system",
            patient_id=request.patient_id,
            details={
                "appointment_id": appointment.id,
                "doctor_id": request.doctor_id,
                "start_time": request.start_time.isoformat(),
                "end_time": request.end_time.isoformat(),
                "celery_task_id": task.id
            }
        )

        return SlotConfirmResponse(
            appointment_id=appointment.id,
            status="confirmed",
            scheduled_time=appointment.start_time,
            fhir_synced=False
        )
