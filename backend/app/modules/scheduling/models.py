from sqlalchemy import String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from app.shared.base_model import Base, TimestampMixin

class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="proposed", nullable=False)
    specialty: Mapped[str] = mapped_column(String(100), nullable=False)
    doctor_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True
    )
    fhir_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")

class SlotAvailability(Base, TimestampMixin):
    __tablename__ = "slot_availabilities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    chair_id: Mapped[int] = mapped_column(Integer, nullable=False)
    nurse_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
