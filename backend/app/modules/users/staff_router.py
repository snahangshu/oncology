from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
import datetime

from app.dependencies import get_db
from app.modules.users.auth_deps import get_current_active_user, require_role
from app.modules.users.models import User, Role, VerificationStatus
from app.modules.users.credential_models import RoleDocumentRequirement, StaffDocument, DocumentStatus
from app.modules.users.staff_schemas import (
    StaffInviteRequest,
    StaffInviteResponse,
    RoleRequirementsResponse,
    DocumentRequirement,
    DocumentUploadRequest,
    DocumentResponse,
    DocumentReviewRequest
)

router = APIRouter()

@router.post("/invite", response_model=StaffInviteResponse)
def invite_staff(
    request: StaffInviteRequest,
    current_admin: Annotated[User, Depends(require_role([Role.ADMIN]))],
    db: Session = Depends(get_db)
):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        email=request.email,
        full_name=request.full_name,
        role=request.role,
        hashed_password="TEMP_PASSWORD", # In real app, generate token and send email
        verification_status=VerificationStatus.INVITED
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/{user_id}/approve")
def approve_staff_user(
    user_id: int,
    current_admin: Annotated[User, Depends(require_role([Role.ADMIN]))],
    db: Session = Depends(get_db)
):
    user_to_approve = db.query(User).filter(User.id == user_id).first()
    if not user_to_approve:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_to_approve.verification_status = VerificationStatus.APPROVED
    db.commit()
    return {"message": f"User {user_to_approve.full_name} approved successfully"}

from pydantic import BaseModel
class RejectRequest(BaseModel):
    reason: str

@router.post("/{user_id}/reject")
def reject_staff_user(
    user_id: int,
    request: RejectRequest,
    current_admin: Annotated[User, Depends(require_role([Role.ADMIN]))],
    db: Session = Depends(get_db)
):
    user_to_reject = db.query(User).filter(User.id == user_id).first()
    if not user_to_reject:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_to_reject.verification_status = VerificationStatus.REJECTED
    # In a real app we'd save request.reason or email the user
    db.commit()
    return {"message": f"User {user_to_reject.full_name} rejected"}

@router.delete("/{user_id}")
def delete_staff_user(
    user_id: int,
    current_admin: Annotated[User, Depends(require_role([Role.ADMIN]))],
    db: Session = Depends(get_db)
):
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user_to_delete)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/requirements/{role}", response_model=RoleRequirementsResponse)
def get_role_requirements(
    role: Role,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    reqs = db.query(RoleDocumentRequirement).filter(RoleDocumentRequirement.role == role).all()
    # Default requirements if none specified in DB
    if not reqs:
        return RoleRequirementsResponse(role=role, requirements=[])
        
    return RoleRequirementsResponse(
        role=role,
        requirements=[
            DocumentRequirement(document_type=r.document_type, is_required=r.is_required)
            for r in reqs
        ]
    )

@router.post("/documents", response_model=DocumentResponse)
def upload_document(
    request: DocumentUploadRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    doc = StaffDocument(
        user_id=current_user.id,
        document_type=request.document_type,
        file_url=request.file_url,
        issue_date=request.issue_date,
        expiry_date=request.expiry_date,
        status=DocumentStatus.PENDING_REVIEW
    )
    db.add(doc)
    
    if current_user.verification_status == VerificationStatus.INVITED:
        current_user.verification_status = VerificationStatus.PROFILE_INCOMPLETE
        
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/documents", response_model=List[DocumentResponse])
def get_my_documents(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    return db.query(StaffDocument).filter(StaffDocument.user_id == current_user.id).all()

@router.get("/{user_id}/documents", response_model=List[DocumentResponse])
def get_user_documents(
    user_id: int,
    current_admin: Annotated[User, Depends(require_role([Role.ADMIN]))],
    db: Session = Depends(get_db)
):
    return db.query(StaffDocument).filter(StaffDocument.user_id == user_id).all()

@router.post("/documents/{doc_id}/review", response_model=DocumentResponse)
def review_document(
    doc_id: int,
    request: DocumentReviewRequest,
    current_admin: Annotated[User, Depends(require_role([Role.ADMIN]))],
    db: Session = Depends(get_db)
):
    doc = db.query(StaffDocument).filter(StaffDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    doc.status = request.status
    doc.verified_by = current_admin.id
    doc.verified_at = datetime.datetime.utcnow().isoformat()
    db.commit()
    db.refresh(doc)
    return doc
