from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import time, date


# ── Doctor Schemas ───────────────────────────────────────────────

class DoctorCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str
    specialty: str = Field(..., description="E.g., Medical Oncology, Radiation Oncology")
    status: str = Field(default="active", description="active or inactive")


class DoctorUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    status: Optional[str] = None


class DoctorResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    specialty: str
    status: str

    class Config:
        from_attributes = True


# ── Schedule Schemas ─────────────────────────────────────────────

class ScheduleCreateRequest(BaseModel):
    day_of_week: Optional[int] = Field(
        None, ge=0, le=6,
        description="0=Monday .. 6=Sunday. Required for recurring schedules."
    )
    start_time: str = Field(..., description="HH:MM format, e.g., '09:00'")
    end_time: str = Field(..., description="HH:MM format, e.g., '17:00'")
    is_recurring: bool = Field(default=True)
    specific_date: Optional[str] = Field(
        None, description="YYYY-MM-DD format. For one-off overrides."
    )


class ScheduleResponse(BaseModel):
    id: int
    doctor_id: int
    day_of_week: Optional[int]
    start_time: str
    end_time: str
    is_recurring: bool
    specific_date: Optional[str]

    class Config:
        from_attributes = True


# ── Availability Schemas ─────────────────────────────────────────

class DoctorAvailabilitySlot(BaseModel):
    doctor_id: int
    doctor_name: str
    specialty: str
    start_time: str
    end_time: str
    is_booked: bool = False


class DailyAvailabilityResponse(BaseModel):
    date: str
    slots: List[DoctorAvailabilitySlot]


# ── Appointment / Patient Roster Schemas ───────────────────────

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    start_time: str
    end_time: str
    status: str
    specialty: str
    urgency_level: Optional[str] = None
    primary_diagnosis: Optional[str] = None
    patient_comments: Optional[str] = None

    class Config:
        from_attributes = True
