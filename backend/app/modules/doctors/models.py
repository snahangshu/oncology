from sqlalchemy import String, Integer, ForeignKey, Boolean, Time, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from datetime import time, date, datetime
from app.shared.base_model import Base, TimestampMixin


class Doctor(Base, TimestampMixin):
    """Represents an onboarded doctor/clinician in the system."""
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    specialty: Mapped[str] = mapped_column(
        String(150), nullable=False,
        comment="E.g., Medical Oncology, Radiation Oncology, Surgical Oncology"
    )
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)

    # Relationships
    schedules: Mapped[List["DoctorSchedule"]] = relationship(
        "DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan"
    )


class DoctorSchedule(Base, TimestampMixin):
    """
    Represents a recurring or one-off availability block for a doctor.
    
    - For recurring weekly schedules: day_of_week is set (0=Mon..6=Sun), specific_date is NULL.
    - For one-off date overrides: specific_date is set, day_of_week can be NULL.
    """
    __tablename__ = "doctor_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    day_of_week: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True,
        comment="0=Monday, 1=Tuesday, ..., 6=Sunday. NULL if specific_date is set."
    )
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    specific_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True,
        comment="Set for one-off schedule overrides. NULL for recurring weekly schedules."
    )

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="schedules")


class DoctorTimeOff(Base, TimestampMixin):
    """
    Represents blocked out time for a doctor (PTO, emergency, etc.)
    The scheduling engine will not return availability slots during this window.
    """
    __tablename__ = "doctor_time_off"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    doctor: Mapped["Doctor"] = relationship("Doctor")
