from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.doctors.schemas import (
    DoctorCreateRequest, DoctorUpdateRequest, DoctorResponse,
    ScheduleCreateRequest, ScheduleResponse,
    DailyAvailabilityResponse, AppointmentResponse
)
from app.modules.doctors.service import DoctorService

router = APIRouter()


# ── Doctor CRUD ──────────────────────────────────────────────────

@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(request: DoctorCreateRequest, db: Session = Depends(get_db)):
    """Onboard a new doctor into the system."""
    service = DoctorService(db)
    return service.create_doctor(request)


@router.get("", response_model=List[DoctorResponse])
def list_doctors(db: Session = Depends(get_db)):
    """List all onboarded doctors."""
    service = DoctorService(db)
    return service.get_all_doctors()


@router.get("/availability", response_model=DailyAvailabilityResponse)
def get_availability(date: str, db: Session = Depends(get_db)):
    """
    Get all doctors' availability for a given date.
    Query param: date=YYYY-MM-DD
    """
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    service = DoctorService(db)
    return service.get_availability_for_date(target_date)


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Get a single doctor by ID."""
    service = DoctorService(db)
    result = service.get_doctor(doctor_id)
    if not result:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return result


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, request: DoctorUpdateRequest, db: Session = Depends(get_db)):
    """Update a doctor's profile."""
    service = DoctorService(db)
    result = service.update_doctor(doctor_id, request)
    if not result:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return result


@router.get("/{doctor_id}/appointments", response_model=List[AppointmentResponse])
def get_doctor_appointments(doctor_id: int, q: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all patients/appointments assigned to a specific doctor. Optional search query."""
    service = DoctorService(db)
    return service.get_doctor_appointments(doctor_id, search_query=q)


# ── Schedule Management ──────────────────────────────────────────

@router.post("/{doctor_id}/schedule", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def add_schedule(doctor_id: int, request: ScheduleCreateRequest, db: Session = Depends(get_db)):
    """Assign a schedule block to a doctor."""
    service = DoctorService(db)
    result = service.add_schedule(doctor_id, request)
    if not result:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return result


@router.get("/{doctor_id}/schedule", response_model=List[ScheduleResponse])
def get_doctor_schedule(doctor_id: int, db: Session = Depends(get_db)):
    """Get a doctor's full weekly schedule."""
    service = DoctorService(db)
    return service.get_doctor_schedules(doctor_id)


@router.delete("/{doctor_id}/schedule/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_schedule(doctor_id: int, schedule_id: int, db: Session = Depends(get_db)):
    """Remove a schedule block from a doctor."""
    service = DoctorService(db)
    deleted = service.remove_schedule(doctor_id, schedule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Schedule not found")
