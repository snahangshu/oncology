from sqlalchemy import Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import List
from app.shared.base_model import Base, TimestampMixin

class InfusionSchedule(Base, TimestampMixin):
    __tablename__ = "infusion_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="proposed", nullable=False)

    # Relationships
    chair_assignments: Mapped[List["ChairAssignment"]] = relationship(
        "ChairAssignment", back_populates="schedule", cascade="all, delete-orphan"
    )
    nurse_assignments: Mapped[List["NurseAssignment"]] = relationship(
        "NurseAssignment", back_populates="schedule", cascade="all, delete-orphan"
    )

class ChairAssignment(Base, TimestampMixin):
    __tablename__ = "chair_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey("infusion_schedules.id", ondelete="CASCADE"), nullable=False)
    chair_id: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    schedule: Mapped["InfusionSchedule"] = relationship("InfusionSchedule", back_populates="chair_assignments")

class NurseAssignment(Base, TimestampMixin):
    __tablename__ = "nurse_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey("infusion_schedules.id", ondelete="CASCADE"), nullable=False)
    nurse_id: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    schedule: Mapped["InfusionSchedule"] = relationship("InfusionSchedule", back_populates="nurse_assignments")
