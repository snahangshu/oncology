import logging
import os
import fitz
from app.workers.celery_app import celery_app
from app.dependencies import SessionLocal
from app.modules.intake.repository import DocumentRepository
from app.modules.intake.models import UploadedDocument
from app.modules.ai.classifiers import DocumentExtractor, InsuranceAuthAgent, CommsAgent

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
        classifier = DocumentExtractor()
        res = classifier.check_completeness(document_id, document_text)

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

@celery_app.task(name="app.workers.tasks.document_processing.process_insurance_auth")
def process_insurance_auth(document_id: int, document_text: str) -> dict:
    """
    Runs the AI InsuranceAuthAgent to extract coverage details.
    """
    agent = InsuranceAuthAgent()
    res = agent.extract_auth_details(document_id, document_text)
    
    # In a real app, you would save `res` to the database here (e.g., in a `InsuranceAuth` model).
    # For now, we return it so the Celery result backend captures it.
    return res

@celery_app.task(name="app.workers.tasks.document_processing.draft_comms_message")
def draft_comms_message(patient_id: int, recipient: str, patient_name: str, missing_docs: str, reason_needed: str) -> dict:
    """
    Runs the AI CommsAgent to draft a missing docs message.
    """
    agent = CommsAgent()
    res = agent.draft_missing_docs_message(patient_id, recipient, patient_name, missing_docs, reason_needed)
    
    # Return the drafted message
    return res

@celery_app.task(name="app.workers.tasks.document_processing.process_pathology_report")
def process_pathology_report(patient_id: int, file_path: str, document_id: int) -> dict:
    """
    Parses a pathology report, extracts tumor details via AI, and updates the patient record.
    """
    from app.modules.ai.classifiers.pathology import PathologyTriageAgent
    from app.modules.intake.models import Patient
    db = SessionLocal()
    try:
        extracted_text = extract_text_from_file(file_path)
        if not extracted_text:
            extracted_text = "MOCK PATHOLOGY PDF TEXT: Patient has stage III breast cancer." # fallback for dummy files
            
        agent = PathologyTriageAgent()
        res = agent.extract_tumor_details(document_id, extracted_text)
        
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            # Safely set the diagnosis string and urgency
            patient.primary_diagnosis = f"{res['cancer_type']} (Stage {res['stage']})"
            patient.urgency_level = res['urgency_level']
            
            from app.modules.intake.models import OncologyIntake
            intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient_id).first()
            if not intake:
                intake = OncologyIntake(patient_id=patient_id)
                db.add(intake)
                
            intake.pathology_report = {
                "fileUrl": f"/api/v1/documents/{document_id}",
                "originalName": os.path.basename(file_path),
                "fileType": "pdf"
            }
            db.commit()
            
        return res
    finally:
        db.close()

