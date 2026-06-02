import sys
import os
from datetime import datetime

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.dependencies import SessionLocal
from app.modules.intake.models import Patient, OncologyIntake, UploadedDocument, DocumentType, IntakePhase
from app.modules.scheduling.models import Appointment

def seed_demo_documents():
    db = SessionLocal()
    try:
        patient = db.query(Patient).filter(Patient.email == "patient@hospital.com").first()
        if not patient:
            print("Patient not found. Run seed_patient_data.py first.")
            return

        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient.id).first()
        if not intake:
            print("Intake not found.")
            return

        demo_docs = [
            {
                "type": DocumentType.REFERRAL_LETTER,
                "phase": IntakePhase.PHASE_1,
                "name": "Dr_Smith_Referral.pdf",
                "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            },
            {
                "type": DocumentType.PATHOLOGY_REPORT,
                "phase": IntakePhase.PHASE_1,
                "name": "Biopsy_Results_May2026.pdf",
                "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            },
            {
                "type": DocumentType.IMAGING_REPORT,
                "phase": IntakePhase.PHASE_1,
                "name": "MRI_Scan_Summary.pdf",
                "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            },
            {
                "type": DocumentType.INSURANCE_AUTHORIZATION,
                "phase": IntakePhase.PHASE_1,
                "name": "Aetna_Prior_Auth_Approval.pdf",
                "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            }
        ]

        for doc_data in demo_docs:
            existing = db.query(UploadedDocument).filter(
                UploadedDocument.patient_id == patient.id,
                UploadedDocument.document_type == doc_data["type"]
            ).first()

            if not existing:
                new_doc = UploadedDocument(
                    patient_id=patient.id,
                    intake_id=intake.id,
                    document_type=doc_data["type"],
                    phase=doc_data["phase"],
                    file_url=doc_data["url"],
                    original_name=doc_data["name"],
                    status="processed"
                )
                db.add(new_doc)
                
                # Update intake JSON
                doc_metadata = {
                    "originalName": doc_data["name"],
                    "fileUrl": doc_data["url"],
                    "fileType": "application/pdf",
                    "uploadedAt": datetime.utcnow().isoformat(),
                    "public_id": f"demo_{doc_data['type'].value.lower()}"
                }
                setattr(intake, doc_data["type"].value.lower(), doc_metadata)
                print(f"Uploaded demo document: {doc_data['name']}")

        # Recalculate status
        intake.completion_percentage = 100
        intake.intake_status = "COMPLETE"

        db.commit()
        print("Successfully uploaded demo documents and completed intake phase 1!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_documents()
