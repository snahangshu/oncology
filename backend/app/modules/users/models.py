import enum
from typing import Optional
from sqlalchemy import String, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base_model import Base, TimestampMixin

class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    RECEPTIONIST = "RECEPTIONIST"
    NURSE = "NURSE"
    PATIENT = "PATIENT"

class VerificationStatus(str, enum.Enum):
    INVITED = "INVITED"
    PROFILE_INCOMPLETE = "PROFILE_INCOMPLETE"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False, default=Role.PATIENT)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), 
        nullable=False, 
        default=VerificationStatus.APPROVED # Default APPROVED for legacy records, logic will set to INVITED
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(nullable=False)
    expires_at: Mapped[str] = mapped_column(String(255), nullable=False) # Store datetime as string or use DateTime
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
