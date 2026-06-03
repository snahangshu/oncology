from sqlalchemy import String, Integer, ForeignKey, Boolean, Time, Date, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any
from datetime import time, date
from app.shared.base_model import Base, TimestampMixin

class Doctor(Base, TimestampMixin):
    """Represents an onboarded doctor/clinician in the system."""
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    specialty: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)

    # Core Enterprise Info
    gender: Mapped[Optional[str]] = mapped_column(String(20))
    profile_photo: Mapped[Optional[str]] = mapped_column(String(500))
    qualifications: Mapped[Optional[str]] = mapped_column(String(255))
    experience_years: Mapped[Optional[int]] = mapped_column(Integer)
    license_number: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Role Classification
    doctor_role: Mapped[Optional[str]] = mapped_column(String(100), comment="Medical Oncologist, Hematologist, etc.")

    # Capacity Limits
    max_new_consults_per_day: Mapped[Optional[int]] = mapped_column(Integer, default=5)
    max_follow_ups_per_day: Mapped[Optional[int]] = mapped_column(Integer, default=15)
    max_working_hours: Mapped[Optional[int]] = mapped_column(Integer, default=8)
    max_urgent_cases_per_day: Mapped[Optional[int]] = mapped_column(Integer, default=2)

    # Preferences & Referral Rules
    accepts_new_patients: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_emergency: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_second_opinions: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_rare_cancers: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_pediatric: Mapped[bool] = mapped_column(Boolean, default=False)
    accepts_clinical_trial_referrals: Mapped[bool] = mapped_column(Boolean, default=True)
    telemedicine_available: Mapped[bool] = mapped_column(Boolean, default=True)

    # Appointment Types mapping to durations
    appointment_durations: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, comment='{"new_consult": 60, "followup": 15}')

    # Relationships
    schedules: Mapped[List["DoctorSchedule"]] = relationship("DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan")
    schedule_exceptions: Mapped[List["DoctorScheduleException"]] = relationship("DoctorScheduleException", back_populates="doctor", cascade="all, delete-orphan")
    locations: Mapped[List["DoctorLocation"]] = relationship("DoctorLocation", back_populates="doctor", cascade="all, delete-orphan")
    disease_expertise: Mapped[List["DoctorDiseaseExpertise"]] = relationship("DoctorDiseaseExpertise", back_populates="doctor", cascade="all, delete-orphan")
    treatment_expertise: Mapped[List["DoctorTreatmentExpertise"]] = relationship("DoctorTreatmentExpertise", back_populates="doctor", cascade="all, delete-orphan")
    tumor_boards: Mapped[List["DoctorTumorBoard"]] = relationship("DoctorTumorBoard", back_populates="doctor", cascade="all, delete-orphan")
    clinical_trials: Mapped[List["DoctorClinicalTrialInterest"]] = relationship("DoctorClinicalTrialInterest", back_populates="doctor", cascade="all, delete-orphan")


# ── Availability & Locations ─────────────────────────────────────

class DoctorSchedule(Base, TimestampMixin):
    __tablename__ = "doctor_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255))
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    specific_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="schedules")


class DoctorScheduleException(Base, TimestampMixin):
    __tablename__ = "doctor_schedule_exceptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    exception_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), comment="E.g., Vacation, Medical Leave")
    
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="schedule_exceptions")


class DoctorLocation(Base, TimestampMixin):
    __tablename__ = "doctor_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    branch: Mapped[str] = mapped_column(String(255), nullable=False)
    clinic_room: Mapped[Optional[str]] = mapped_column(String(100))
    day_of_week: Mapped[Optional[int]] = mapped_column(Integer)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="locations")


# ── Expertise & Academic ─────────────────────────────────────────

class DoctorDiseaseExpertise(Base, TimestampMixin):
    __tablename__ = "doctor_disease_expertise"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    disease_type: Mapped[str] = mapped_column(String(150), nullable=False, comment="E.g., Breast Cancer, AML")
    category: Mapped[str] = mapped_column(String(100), nullable=False, comment="Oncology, Hematology")

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="disease_expertise")


class DoctorTreatmentExpertise(Base, TimestampMixin):
    __tablename__ = "doctor_treatment_expertise"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    treatment_type: Mapped[str] = mapped_column(String(150), nullable=False)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="treatment_expertise")


class DoctorTumorBoard(Base, TimestampMixin):
    __tablename__ = "doctor_tumor_boards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    board_name: Mapped[str] = mapped_column(String(150), nullable=False)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="tumor_boards")


class DoctorClinicalTrialInterest(Base, TimestampMixin):
    __tablename__ = "doctor_clinical_trial_interests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    trial_topic: Mapped[str] = mapped_column(String(255), nullable=False)

    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="clinical_trials")


# ── Routing Profile ─────────────────────────────────────────────

class DoctorRoutingProfile(Base, TimestampMixin):
    __tablename__ = "doctor_routing_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, unique=True)
    active_cases: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    avg_wait_days: Mapped[Optional[Float]] = mapped_column(Float, default=0.0)
    avg_consult_duration: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    urgent_case_capacity_remaining: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    accepting_new_patients: Mapped[bool] = mapped_column(Boolean, default=True)

class DoctorPublication(Base, TimestampMixin):
    __tablename__ = "doctor_publications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    journal: Mapped[str] = mapped_column(String(255), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

class DoctorCaseStudy(Base, TimestampMixin):
    __tablename__ = "doctor_case_studies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    document_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

class DoctorReference(Base, TimestampMixin):
    __tablename__ = "doctor_references"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    reference_name: Mapped[str] = mapped_column(String(255), nullable=False)
    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_info: Mapped[str] = mapped_column(String(255), nullable=False)

class DoctorPermission(Base, TimestampMixin):
    __tablename__ = "doctor_permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. CAN_PRESCRIBE_CHEMO

