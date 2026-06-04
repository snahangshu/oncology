import enum
from typing import Optional
from sqlalchemy import String, Integer, Enum, Boolean, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin
from app.modules.users.models import Role

class DocumentStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    REQUIRES_UPDATE = "REQUIRES_UPDATE"

class DocumentType(str, enum.Enum):
    GOVERNMENT_ID = "GOVERNMENT_ID"
    MEDICAL_LICENSE = "MEDICAL_LICENSE"
    DEGREE_CERTIFICATE = "DEGREE_CERTIFICATE"
    CV = "CV"
    BOARD_CERTIFICATION = "BOARD_CERTIFICATION"
    NURSING_LICENSE = "NURSING_LICENSE"
    EXPERIENCE_LETTER = "EXPERIENCE_LETTER"
    EMPLOYMENT_AGREEMENT = "EMPLOYMENT_AGREEMENT"

class RoleDocumentRequirement(Base, TimestampMixin):
    __tablename__ = "role_document_requirements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False)
    document_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)

class StaffDocument(Base, TimestampMixin):
    __tablename__ = "staff_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.PENDING_REVIEW)
    issue_date: Mapped[Optional[str]] = mapped_column(Date, nullable=True) # YYYY-MM-DD
    expiry_date: Mapped[Optional[str]] = mapped_column(Date, nullable=True) # YYYY-MM-DD
    verified_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # ISO format string

class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "StaffDocument", "User"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "UPLOADED", "VERIFIED", "REJECTED"
    performed_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
