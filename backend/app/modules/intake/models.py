from sqlalchemy import String, Integer, Date, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional, Dict, Any
from datetime import date
from app.shared.base_model import Base, TimestampMixin

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

class InsuranceRecord(Base, TimestampMixin):
    __tablename__ = "insurance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(150), nullable=False)
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    group_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="insurance_records")

class UploadedDocument(Base, TimestampMixin):
    __tablename__ = "uploaded_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="uploaded", nullable=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="documents")
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

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="oncology_intake")
