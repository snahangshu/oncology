from typing import List, Optional
from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from app.modules.doctors.models import Doctor, DoctorSchedule
from app.modules.doctors.repository import DoctorRepository, DoctorScheduleRepository
from app.modules.doctors.schemas import (
    DoctorCreateRequest, DoctorUpdateRequest, DoctorResponse,
    ScheduleCreateRequest, ScheduleResponse,
    DoctorAvailabilitySlot, DailyAvailabilityResponse,
    AppointmentResponse
)


class DoctorService:
    def __init__(self, db: Session):
        self.db = db
        self.doctor_repo = DoctorRepository(db)
        self.schedule_repo = DoctorScheduleRepository(db)

    # ── Doctor CRUD ──────────────────────────────────────────────

    def create_doctor(self, request: DoctorCreateRequest) -> DoctorResponse:
        # Check for existing email
        existing = self.doctor_repo.get_by_email(request.email)
        if existing:
            # Update existing doctor instead of duplicating
            existing.first_name = request.first_name
            existing.last_name = request.last_name
            existing.phone = request.phone
            existing.specialty = request.specialty
            existing.status = request.status
            self.doctor_repo.update(existing)
            return self._to_response(existing)

        doctor = Doctor(
            first_name=request.first_name,
            last_name=request.last_name,
            email=request.email,
            phone=request.phone,
            specialty=request.specialty,
            status=request.status,
        )
        self.doctor_repo.create(doctor)
        return self._to_response(doctor)

    def get_all_doctors(self) -> List[DoctorResponse]:
        doctors = self.doctor_repo.get_all()
        return [self._to_response(d) for d in doctors]

    def get_doctor(self, doctor_id: int) -> Optional[DoctorResponse]:
        doctor = self.doctor_repo.get(doctor_id)
        if not doctor:
            return None
        return self._to_response(doctor)

    def update_doctor(self, doctor_id: int, request: DoctorUpdateRequest) -> Optional[DoctorResponse]:
        doctor = self.doctor_repo.get(doctor_id)
        if not doctor:
            return None

        if request.first_name is not None:
            doctor.first_name = request.first_name
        if request.last_name is not None:
            doctor.last_name = request.last_name
        if request.phone is not None:
            doctor.phone = request.phone
        if request.specialty is not None:
            doctor.specialty = request.specialty
        if request.status is not None:
            doctor.status = request.status

        self.doctor_repo.update(doctor)
        return self._to_response(doctor)

    # ── Schedule Management ──────────────────────────────────────

    def add_schedule(self, doctor_id: int, request: ScheduleCreateRequest) -> Optional[ScheduleResponse]:
        doctor = self.doctor_repo.get(doctor_id)
        if not doctor:
            return None

        start = datetime.strptime(request.start_time, "%H:%M").time()
        end = datetime.strptime(request.end_time, "%H:%M").time()

        specific = None
        if request.specific_date:
            specific = datetime.strptime(request.specific_date, "%Y-%m-%d").date()

        schedule = DoctorSchedule(
            doctor_id=doctor_id,
            day_of_week=request.day_of_week,
            start_time=start,
            end_time=end,
            is_recurring=request.is_recurring,
            specific_date=specific,
        )
        self.schedule_repo.create(schedule)
        return self._schedule_to_response(schedule)

    def get_doctor_schedules(self, doctor_id: int) -> List[ScheduleResponse]:
        schedules = self.schedule_repo.get_by_doctor_id(doctor_id)
        return [self._schedule_to_response(s) for s in schedules]

    def remove_schedule(self, doctor_id: int, schedule_id: int) -> bool:
        return self.schedule_repo.delete_by_id_and_doctor(schedule_id, doctor_id)

    # ── Availability ─────────────────────────────────────────────

    def get_availability_for_date(self, target_date: date) -> DailyAvailabilityResponse:
        """
        Returns all doctors' availability for a given date.
        Cross-references schedules against booked appointments.
        """
        day_of_week = target_date.weekday()  # 0=Monday
        schedules = self.schedule_repo.get_schedules_for_day(day_of_week, target_date)

        # Get all appointments for this date to check for conflicts
        from app.modules.scheduling.models import Appointment
        from app.modules.doctors.models import DoctorTimeOff
        day_start = datetime.combine(target_date, time(0, 0))
        day_end = datetime.combine(target_date, time(23, 59))
        
        appointments = (
            self.db.query(Appointment)
            .filter(Appointment.start_time >= day_start, Appointment.start_time <= day_end)
            .all()
        )
        
        time_offs = (
            self.db.query(DoctorTimeOff)
            .filter(DoctorTimeOff.start_time >= day_start, DoctorTimeOff.start_time <= day_end)
            .all()
        )

        slots: List[DoctorAvailabilitySlot] = []
        for sched in schedules:
            doctor = self.doctor_repo.get(sched.doctor_id)
            if not doctor or doctor.status != "active":
                continue

            current_time = datetime.combine(target_date, sched.start_time)
            end_datetime = datetime.combine(target_date, sched.end_time)
            
            while current_time < end_datetime:
                chunk_end = current_time + timedelta(minutes=15)
                if chunk_end > end_datetime:
                    break
                    
                # Check if this 15 min chunk overlaps with an appointment
                is_booked = any(
                    apt.start_time < chunk_end and apt.end_time > current_time
                    for apt in appointments
                    if getattr(apt, 'doctor_id', None) == doctor.id
                )
                
                # Check if it overlaps with a time-off block
                if not is_booked:
                    is_booked = any(
                        toff.start_time < chunk_end and toff.end_time > current_time
                        for toff in time_offs
                        if getattr(toff, 'doctor_id', None) == doctor.id
                    )

                slots.append(DoctorAvailabilitySlot(
                    doctor_id=doctor.id,
                    doctor_name=f"{doctor.first_name} {doctor.last_name}",
                    specialty=doctor.specialty,
                    start_time=current_time.strftime("%H:%M"),
                    end_time=chunk_end.strftime("%H:%M"),
                    is_booked=is_booked,
                ))
                
                current_time = chunk_end

        return DailyAvailabilityResponse(
            date=target_date.isoformat(),
            slots=slots,
        )

    def get_doctor_appointments(self, doctor_id: int, search_query: Optional[str] = None) -> List[AppointmentResponse]:
        """
        Fetch all appointments assigned to a specific doctor along with patient details.
        Optionally filter by patient first name or last name.
        """
        from app.modules.scheduling.models import Appointment
        from app.modules.intake.models import Patient
        from sqlalchemy import or_
        
        query = (
            self.db.query(Appointment, Patient)
            .join(Patient, Appointment.patient_id == Patient.id)
            .filter(Appointment.doctor_id == doctor_id)
        )

        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern)
                )
            )

        appointments = query.order_by(Appointment.start_time).all()
        
        results = []
        for apt, pat in appointments:
            results.append(
                AppointmentResponse(
                    id=apt.id,
                    patient_id=pat.id,
                    patient_name=f"{pat.first_name} {pat.last_name}",
                    start_time=apt.start_time.isoformat(),
                    end_time=apt.end_time.isoformat(),
                    status=apt.status,
                    specialty=apt.specialty,
                    urgency_level=pat.urgency_level,
                    primary_diagnosis=pat.primary_diagnosis,
                    patient_comments=pat.patient_comments
                )
            )
        return results

    # ── Helpers ───────────────────────────────────────────────────

    def _to_response(self, doctor: Doctor) -> DoctorResponse:
        return DoctorResponse(
            id=doctor.id,
            first_name=doctor.first_name,
            last_name=doctor.last_name,
            email=doctor.email,
            phone=doctor.phone,
            specialty=doctor.specialty,
            status=doctor.status,
        )

    def _schedule_to_response(self, s: DoctorSchedule) -> ScheduleResponse:
        return ScheduleResponse(
            id=s.id,
            doctor_id=s.doctor_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time.strftime("%H:%M"),
            end_time=s.end_time.strftime("%H:%M"),
            is_recurring=s.is_recurring,
            specific_date=s.specific_date.isoformat() if s.specific_date else None,
        )
