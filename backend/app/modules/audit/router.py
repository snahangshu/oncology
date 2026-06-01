from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.audit.repository import AuditRepository

router = APIRouter()

@router.get("")
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Retrieve audit trail logs. (CQC/NABH compliance reports).
    """
    repo = AuditRepository(db)
    # Map the model directly to simple JSON output
    entries = repo.get_all(skip, limit)
    return [
        {
            "id": entry.id,
            "action": entry.action,
            "user_id": entry.user_id,
            "patient_id": entry.patient_id,
            "timestamp": entry.timestamp,
            "details": entry.details
        }
        for entry in entries
    ]
