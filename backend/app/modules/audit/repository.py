from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.modules.audit.models import AuditEntry

class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, id: int) -> Optional[AuditEntry]:
        return self.db.query(AuditEntry).filter(AuditEntry.id == id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[AuditEntry]:
        return self.db.query(AuditEntry).order_by(AuditEntry.timestamp.desc()).offset(skip).limit(limit).all()

    def append_only_insert(
        self, action: str, user_id: Optional[str], patient_id: Optional[int], details: Dict[str, Any]
    ) -> AuditEntry:
        """
        Immutable append-only insert for audit entries.
        No updates or deletes are allowed on the audit trail.
        """
        entry = AuditEntry(
            action=action,
            user_id=user_id,
            patient_id=patient_id,
            details=details
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry
