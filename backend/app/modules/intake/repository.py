from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.shared.base_repository import BaseRepository
from app.modules.intake.models import Patient, InsuranceRecord, UploadedDocument, CompletenessCheck

class PatientRepository(BaseRepository[Patient]):
    def __init__(self, db: Session):
        super().__init__(Patient, db)

    def get_by_email(self, email: str) -> Optional[Patient]:
        return self.db.query(self.model).filter(self.model.email == email).first()

    def add_insurance_record(self, patient_id: int, provider_name: str, policy_number: str, group_number: Optional[str] = None) -> InsuranceRecord:
        record = InsuranceRecord(
            patient_id=patient_id,
            provider_name=provider_name,
            policy_number=policy_number,
            group_number=group_number
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

class DocumentRepository(BaseRepository[UploadedDocument]):
    def __init__(self, db: Session):
        super().__init__(UploadedDocument, db)

    def get_by_patient_id(self, patient_id: int) -> List[UploadedDocument]:
        return self.db.query(self.model).filter(self.model.patient_id == patient_id).all()

    def create_completeness_check(
        self, document_id: int, is_complete: bool, missing_sections: List[str], extracted_metadata: Dict[str, Any]
    ) -> CompletenessCheck:
        check = CompletenessCheck(
            document_id=document_id,
            is_complete=is_complete,
            missing_sections=missing_sections,
            extracted_metadata=extracted_metadata
        )
        self.db.add(check)
        self.db.commit()
        self.db.refresh(check)
        return check

    def get_latest_completeness_check(self, document_id: int) -> Optional[CompletenessCheck]:
        return self.db.query(CompletenessCheck).filter(
            CompletenessCheck.document_id == document_id
        ).order_by(CompletenessCheck.created_at.desc()).first()
