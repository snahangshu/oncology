from sqlalchemy import String, Integer, Date, ForeignKey, Boolean, JSON, Enum as SAEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from app.shared.base_model import Base, TimestampMixin
import enum

class IntakePhase(str, enum.Enum):
    PHASE_1 = "PHASE_1"
    PHASE_2 = "PHASE_2"
    PHASE_3 = "PHASE_3"

class DocumentType(str, enum.Enum):
    REFERRAL_LETTER = "REFERRAL_LETTER"
    PATHOLOGY_REPORT = "PATHOLOGY_REPORT"
    IMAGING_REPORT = "IMAGING_REPORT"
    INSURANCE_AUTHORIZATION = "INSURANCE_AUTHORIZATION"
    CBC_REPORT = "CBC_REPORT"
    CMP_REPORT = "CMP_REPORT"
    MEDICATION_LIST = "MEDICATION_LIST"
    ALLERGY_RECORD = "ALLERGY_RECORD"
    CONSULTATION_NOTE = "CONSULTATION_NOTE"
    NURSING_NOTE = "NURSING_NOTE"
    SURGERY_REPORT = "SURGERY_REPORT"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"
    RADIATION_REPORT = "RADIATION_REPORT"

class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    primary_diagnosis: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    urgency_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    patient_comments: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Relationships
    insurance_records: Mapped[List["InsuranceRecord"]] = relationship(
        "InsuranceRecord", back_populates="patient", cascade="all, delete-orphan"
    )
    documents: Mapped[List["UploadedDocument"]] = relationship(
        "UploadedDocument", back_populates="patient", cascade="all, delete-orphan"
    )
    appointments: Mapped[List["Appointment"]] = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )
    oncology_intake: Mapped[Optional["OncologyIntake"]] = relationship(
        "OncologyIntake", back_populates="patient", cascade="all, delete-orphan", uselist=False
    )
    treatment_plans: Mapped[List["TreatmentPlan"]] = relationship(
        "TreatmentPlan", back_populates="patient", cascade="all, delete-orphan"
    )
    lab_results: Mapped[List["LabResult"]] = relationship(
        "LabResult", back_populates="patient", cascade="all, delete-orphan"
    )

class InsuranceRecord(Base, TimestampMixin):
    __tablename__ = "insurance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(150), nullable=False)
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    group_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    request_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    auth_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="Pending")
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="insurance_records")

class UploadedDocument(Base, TimestampMixin):
    __tablename__ = "uploaded_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    intake_id: Mapped[Optional[int]] = mapped_column(ForeignKey("oncology_intakes.id", ondelete="CASCADE"), nullable=True)
    document_type: Mapped[DocumentType] = mapped_column(SAEnum(DocumentType), nullable=False)
    phase: Mapped[IntakePhase] = mapped_column(SAEnum(IntakePhase), nullable=False)
    
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # User ID

    from sqlalchemy import Text
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="uploaded", nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="documents")
    oncology_intake: Mapped[Optional["OncologyIntake"]] = relationship("OncologyIntake", back_populates="documents")
    completeness_checks: Mapped[List["CompletenessCheck"]] = relationship(
        "CompletenessCheck", back_populates="document", cascade="all, delete-orphan"
    )

class CompletenessCheck(Base, TimestampMixin):
    __tablename__ = "completeness_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("uploaded_documents.id", ondelete="CASCADE"), nullable=False)
    is_complete: Mapped[bool] = mapped_column(Boolean, nullable=False)
    missing_sections: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    extracted_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    document: Mapped["UploadedDocument"] = relationship("UploadedDocument", back_populates="completeness_checks")

class OncologyIntake(Base, TimestampMixin):
    __tablename__ = "oncology_intakes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Document Metadata stored as JSON (e.g. { originalName: "file.pdf", fileUrl: "cloudinary_url", fileType: "pdf", uploadedAt: "..." })
    referral_letter: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    pathology_report: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    imaging_report: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    insurance_authorization: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    intake_status: Mapped[str] = mapped_column(String(50), default="INCOMPLETE", nullable=False)
    completion_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ai_summary: Mapped[Optional[str]] = mapped_column(String(5000), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="oncology_intake")
    documents: Mapped[List["UploadedDocument"]] = relationship("UploadedDocument", back_populates="oncology_intake", cascade="all, delete-orphan")

class TreatmentPlan(Base, TimestampMixin):
    __tablename__ = "treatment_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    appointment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    regimen_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING_AUTH")
    cycles: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_cycle: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="treatment_plans")
    treatment_cycles: Mapped[List["TreatmentCycle"]] = relationship("TreatmentCycle", back_populates="treatment_plan", cascade="all, delete-orphan", order_by="TreatmentCycle.cycle_number")

class TreatmentCycle(Base, TimestampMixin):
    __tablename__ = "treatment_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    treatment_plan_id: Mapped[int] = mapped_column(ForeignKey("treatment_plans.id", ondelete="CASCADE"), nullable=False)
    cycle_number: Mapped[int] = mapped_column(Integer, nullable=False)
    planned_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="PLANNED", nullable=False)
    
    # Infusion Readiness Workflow Flags
    labs_uploaded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ai_fit_check_passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pharmacy_vials_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ready_for_booking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dose_status: Mapped[str] = mapped_column(String(50), default="FULL_DOSE", nullable=False)
    chair_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Soft link to chair
    appointment_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Soft link to appointment
    doctor_clearance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    delay_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    delayed_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    treatment_plan: Mapped["TreatmentPlan"] = relationship("TreatmentPlan", back_populates="treatment_cycles")
    events: Mapped[List["TreatmentCycleEvent"]] = relationship("TreatmentCycleEvent", back_populates="treatment_cycle", cascade="all, delete-orphan", order_by="TreatmentCycleEvent.event_time")

class LabResult(Base, TimestampMixin):
    __tablename__ = "lab_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    test_name: Mapped[str] = mapped_column(String(150), nullable=False)
    result_value: Mapped[str] = mapped_column(String(50), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_range: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Normal") # Normal, High, Low
    date_collected: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="lab_results")

class SafetyRule(Base, TimestampMixin):
    __tablename__ = "safety_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rule_name: Mapped[str] = mapped_column(String(200), nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class TreatmentCycleEvent(Base, TimestampMixin):
    __tablename__ = "treatment_cycle_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cycle_id: Mapped[int] = mapped_column(ForeignKey("treatment_cycles.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Relationships
    treatment_cycle: Mapped["TreatmentCycle"] = relationship("TreatmentCycle", back_populates="events")
