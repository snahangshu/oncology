import sys
import os
from datetime import date

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.dependencies import SessionLocal
from app.modules.intake.models import Patient, OncologyIntake
from app.modules.scheduling.models import Appointment
from app.modules.users.models import User

def seed_patient_data():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "patient@hospital.com").first()
        if not user:
            print("patient@hospital.com user not found. Please run seed_users.py first.")
            return

        patient = db.query(Patient).filter(Patient.email == "patient@hospital.com").first()
        if not patient:
            patient = Patient(
                first_name="John",
                last_name="Doe",
                date_of_birth=date(1980, 1, 1),
                email="patient@hospital.com",
                phone="555-0199",
                gender="Male"
            )
            db.add(patient)
            db.flush()
            print("Created Patient record.")
        else:
            print("Patient record already exists.")

        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == patient.id).first()
        if not intake:
            intake = OncologyIntake(
                patient_id=patient.id,
                intake_status="INCOMPLETE",
                completion_percentage=0
            )
            db.add(intake)
            print("Created OncologyIntake record.")
        else:
            print("OncologyIntake record already exists.")

        db.commit()
        print("Successfully seeded patient data!")
    except Exception as e:
        print(f"Error seeding patient data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_patient_data()
