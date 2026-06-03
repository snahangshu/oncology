from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import time, date

# ── Nested Expertise Schemas ─────────────────────────────────────
class DiseaseExpertiseItem(BaseModel):
    disease: str
    category: str

class DoctorCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str
    specialty: str = Field(..., description="E.g., Medical Oncology, Radiation Oncology")
    status: str = Field(default="active", description="active or inactive")
    
    # Core Enterprise Info
    gender: Optional[str] = None
    profile_photo: Optional[str] = None
    qualifications: Optional[str] = None
    experience_years: Optional[int] = 0
    license_number: Optional[str] = None
    doctor_role: Optional[str] = None
    
    # Capacity Limits
    max_new_consults_per_day: Optional[int] = 5
    max_follow_ups_per_day: Optional[int] = 15
    max_working_hours: Optional[int] = 8
    max_urgent_cases_per_day: Optional[int] = 2
    
    # Preferences & Referral Rules
    accepts_new_patients: bool = True
    accepts_emergency: bool = True
    accepts_second_opinions: bool = True
    accepts_rare_cancers: bool = True
    accepts_pediatric: bool = False
    accepts_clinical_trial_referrals: bool = True
    telemedicine_available: bool = True
    
    appointment_durations: Optional[Dict[str, Any]] = None
    
    # Expertise
    disease_expertise: List[DiseaseExpertiseItem] = []
    treatment_expertise: List[str] = []


class DoctorUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    status: Optional[str] = None
    max_new_consults_per_day: Optional[int] = None
    max_follow_ups_per_day: Optional[int] = None


class DoctorResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    specialty: str
    status: str
    doctor_role: Optional[str] = None
    experience_years: Optional[int] = None

    class Config:
        from_attributes = True


# ── Schedule Schemas ─────────────────────────────────────────────

class ScheduleCreateRequest(BaseModel):
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: str = Field(..., description="HH:MM format")
    end_time: str = Field(..., description="HH:MM format")
    is_recurring: bool = Field(default=True)
    specific_date: Optional[str] = Field(None, description="YYYY-MM-DD format")
    location: Optional[str] = None


class ScheduleResponse(BaseModel):
    id: int
    doctor_id: int
    day_of_week: Optional[int]
    start_time: str
    end_time: str
    is_recurring: bool
    specific_date: Optional[str]
    location: Optional[str]

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
