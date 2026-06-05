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

        from app.modules.intake.models import Patient
        patient = self.db.query(Patient).filter(Patient.id == query.patient_id).first()
        primary_diagnosis = getattr(patient, 'primary_diagnosis', "") if patient else ""
        urgency_level = getattr(patient, 'urgency_level', "ROUTINE") if patient else "ROUTINE"
        patient_comments = getattr(patient, 'patient_comments', "") if patient else ""

        from app.modules.ai.classifiers.duration_predictor import DurationPredictor
        predictor = DurationPredictor()
        prediction = predictor.predict_duration(
            primary_diagnosis=primary_diagnosis,
            patient_comments=patient_comments,
            appointment_type=query.appointment_type
        )
        duration_minutes = prediction.get("recommended_duration_minutes", 60)
            
        required_chunks = duration_minutes // 15

        from app.modules.doctors.service import DoctorService
        doc_service = DoctorService(self.db)
        
        scorer = SlotScorer()
        options = []
        
        current_date = start.date()
        end_date = end.date()
        
        slot_id_counter = 1
        
        while current_date <= end_date:
            avail = doc_service.get_availability_for_date(current_date, query.appointment_type)
            
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
                        
                        # Only show slots that are in the future
                        if full_start <= datetime.utcnow():
                            i += 1
                            continue
                        
                        # Double-booking check: Does the doctor have an appointment here?
                        existing_doc_appt = self.db.query(Appointment).filter(
                            Appointment.doctor_id == doc_id,
                            Appointment.start_time < full_end,
                            Appointment.end_time > full_start
                        ).first()
                        if existing_doc_appt:
                            i += 1
                            continue

                        # Double-booking check: Does the patient have an appointment here?
                        existing_pat_appt = self.db.query(Appointment).filter(
                            Appointment.patient_id == query.patient_id,
                            Appointment.start_time < full_end,
                            Appointment.end_time > full_start
                        ).first()
                        if existing_pat_appt:
                            i += 1
                            continue
                        
                        doctor_specialty = doc_slots[i].specialty
                        
                        # Fetch doctor from DB to get details for scoring and options
                        doctor_obj = doc_service.doctor_repo.get(doc_id)
                        disease_expertise = [d.disease_type for d in doctor_obj.disease_expertise] if doctor_obj else []
                        treatment_expertise = [t.treatment_type for t in doctor_obj.treatment_expertise] if doctor_obj else []
                        exp = getattr(doctor_obj, 'experience_years', None) if doctor_obj else None
                        qual = getattr(doctor_obj, 'qualifications', None) if doctor_obj else None
                        
                        score, reasoning = scorer.score_slot(
                            patient_id=query.patient_id, 
                            slot_start_time=full_start, 
                            specialty=query.specialty,
                            urgency_level=urgency_level,
                            primary_diagnosis=primary_diagnosis,
                            doctor_specialty=doctor_specialty,
                            doctor_id=doc_id,
                            disease_expertise=disease_expertise,
                            treatment_expertise=treatment_expertise
                        )


                        options.append(
                            SlotOption(
                                slot_id=f"doc_slot_{slot_id_counter}",
                                doctor_id=doc_id,
                                doctor_name=doc_slots[i].doctor_name,
                                experience_years=exp,
                                qualifications=qual,
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
        return options[:12]

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
