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
        Dynamically calculates required duration based on appointment_type.
        """
        start = query.preferred_start_date or datetime.utcnow()
        end = query.preferred_end_date or (start + timedelta(days=7))

        duration_minutes = 60
        if query.appointment_type == "follow-up":
            duration_minutes = 15
        elif query.appointment_type == "infusion":
            duration_minutes = 30
            
        required_chunks = duration_minutes // 15

        from app.modules.doctors.service import DoctorService
        doc_service = DoctorService(self.db)
        
        scorer = SlotScorer()
        options = []
        
        current_date = start.date()
        end_date = end.date()
        
        slot_id_counter = 1
        
        from app.modules.intake.models import Patient
        patient = self.db.query(Patient).filter(Patient.id == query.patient_id).first()
        primary_diagnosis = getattr(patient, 'primary_diagnosis', "") if patient else ""
        urgency_level = getattr(patient, 'urgency_level', "ROUTINE") if patient else "ROUTINE"
        
        while current_date <= end_date:
            avail = doc_service.get_availability_for_date(current_date)
            
            # Group slots by doctor
            docs_slots = {}
            for s in avail.slots:
                if s.specialty.lower() == query.specialty.lower() and not s.is_booked:
                    if s.doctor_id not in docs_slots:
                        docs_slots[s.doctor_id] = []
                    docs_slots[s.doctor_id].append(s)
                    
            for doc_id, doc_slots in docs_slots.items():
                # Sort slots by start_time
                doc_slots.sort(key=lambda x: datetime.strptime(x.start_time, "%H:%M").time())
                
                # Find contiguous chunks
                i = 0
                while i <= len(doc_slots) - required_chunks:
                    is_contiguous = True
                    for j in range(required_chunks - 1):
                        current_end = datetime.strptime(doc_slots[i+j].end_time, "%H:%M").time()
                        next_start = datetime.strptime(doc_slots[i+j+1].start_time, "%H:%M").time()
                        if current_end != next_start:
                            is_contiguous = False
                            break
                    
                    if is_contiguous:
                        start_t = datetime.strptime(doc_slots[i].start_time, "%H:%M").time()
                        end_t = datetime.strptime(doc_slots[i + required_chunks - 1].end_time, "%H:%M").time()
                        
                        full_start = datetime.combine(current_date, start_t)
                        full_end = datetime.combine(current_date, end_t)
                        
                        doctor_specialty = doc_slots[i].specialty
                        
                        score, reasoning = scorer.score_slot(
                            patient_id=query.patient_id, 
                            slot_start_time=full_start, 
                            specialty=query.specialty,
                            urgency_level=urgency_level,
                            primary_diagnosis=primary_diagnosis,
                            doctor_specialty=doctor_specialty
                        )
                        
                        options.append(
                            SlotOption(
                                slot_id=f"doc_slot_{slot_id_counter}",
                                doctor_id=doc_id,
                                doctor_name=doc_slots[i].doctor_name,
                                start_time=full_start,
                                end_time=full_end,
                                score=score,
                                reasoning=reasoning
                            )
                        )
                        slot_id_counter += 1
                        i += required_chunks
                    else:
                        i += 1
                        
            current_date += timedelta(days=1)

        options.sort(key=lambda x: x.score, reverse=True)
        return options[:3]

    def confirm_slot(self, request: SlotConfirmRequest) -> SlotConfirmResponse:
        """
        Confirms a chosen appointment slot, updates database,
        triggers async FHIR synchronization, and records audit trail.
        """
        # If not force_overbook, we would normally double check availability here
        # (Omitted for brevity in this MVP, but force_overbook bypasses any checking).
        
        appointment = Appointment(
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            start_time=request.start_time,
            end_time=request.end_time,
            status="confirmed",
            specialty="oncology"
        )
        self.appointment_repo.create(appointment)

        from app.workers.tasks.fhir_sync import async_write_appointment_to_aria
        task = async_write_appointment_to_aria.delay(appointment.id)

        self.audit_repo.append_only_insert(
            action="confirm_slot",
            user_id="system",
            patient_id=request.patient_id,
            details={
                "appointment_id": appointment.id,
                "doctor_id": request.doctor_id,
                "start_time": request.start_time.isoformat(),
                "end_time": request.end_time.isoformat(),
                "force_overbook": request.force_overbook,
                "celery_task_id": task.id
            }
        )

        return SlotConfirmResponse(
            appointment_id=appointment.id,
            status="confirmed",
            scheduled_time=appointment.start_time,
            fhir_synced=False
        )
