import logging
import os
import fitz
from app.workers.celery_app import celery_app
from app.dependencies import SessionLocal
from app.modules.intake.repository import DocumentRepository
from app.modules.intake.models import UploadedDocument
from app.modules.ai.classifiers.document_completeness import DocCompletenessClassifier

logger = logging.getLogger(__name__)

def extract_text_from_file(file_path: str) -> str:
    text = ""
    try:
        if os.path.exists(file_path):
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text()
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
    return text.strip()

@celery_app.task(name="app.workers.tasks.document_processing.process_uploaded_doc")
def process_uploaded_doc(patient_id: int, file_path: str) -> int:
    """
    Simulates OCR document preprocessing, saves the document record in database,
    and triggers completeness verification.
    """
    db = SessionLocal()
    try:
        repo = DocumentRepository(db)
        doc = UploadedDocument(
            patient_id=patient_id,
            document_type="Uploaded Document",
            filename=os.path.basename(file_path),
            status="uploaded"
        )
        repo.create(doc)
        
        extracted_text = extract_text_from_file(file_path)
        if not extracted_text:
            extracted_text = "No text could be extracted from the document."
            
        # Trigger completeness checks
        trigger_completeness_check.delay(doc.id, extracted_text)
        return doc.id
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.document_processing.trigger_completeness_check")
def trigger_completeness_check(document_id: int, document_text: str) -> bool:
    """
    Runs the AI DocCompletenessClassifier to verify required sections.
    """
    db = SessionLocal()
    try:
        repo = DocumentRepository(db)
        doc = repo.get(document_id)
        if not doc:
            logger.error(f"Document {document_id} not found.")
            return False

        # Run AI Completeness check
        classifier = DocCompletenessClassifier()
        res = classifier.verify(document_id, document_text)

        # Record checks in repository
        repo.create_completeness_check(
            document_id=document_id,
            is_complete=res.is_complete,
            missing_sections=res.missing_sections,
            extracted_metadata=res.extracted_metadata
        )

        doc.status = "processed" if res.is_complete else "incomplete"
        repo.update(doc)
        return res.is_complete
    finally:
        db.close()
