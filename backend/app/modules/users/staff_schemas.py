from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
from app.modules.users.models import Role, VerificationStatus
from app.modules.users.credential_models import DocumentType, DocumentStatus

class StaffInviteRequest(BaseModel):
    full_name: str
    email: EmailStr
    role: Role

class StaffInviteResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: Role
    verification_status: VerificationStatus

class DocumentRequirement(BaseModel):
    document_type: DocumentType
    is_required: bool

class RoleRequirementsResponse(BaseModel):
    role: Role
    requirements: List[DocumentRequirement]

class DocumentUploadRequest(BaseModel):
    document_type: DocumentType
    file_url: str
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None

class DocumentResponse(BaseModel):
    id: int
    document_type: DocumentType
    file_url: str
    status: DocumentStatus
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    verified_at: Optional[str] = None

class DocumentReviewRequest(BaseModel):
    status: DocumentStatus
    rejection_reason: Optional[str] = None
