import sys
import os
from datetime import date

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.dependencies import SessionLocal
from app.modules.intake.models import Patient, OncologyIntake
from app.modules.scheduling.models import Appointment

def seed_custom_patients():
    db = SessionLocal()
    try:
        # Create Sanjeet
        sanjeet = Patient(
            first_name="Sanjeet",
            last_name="Kumar",
            date_of_birth=date(1990, 5, 15),
            email="sanjeet@example.com",
            phone="555-0001",
            gender="Male"
        )
        db.add(sanjeet)
        
        # Create Akhil
        akhil = Patient(
            first_name="Akhil",
            last_name="Sharma",
            date_of_birth=date(1985, 10, 20),
            email="akhil@example.com",
            phone="555-0002",
            gender="Male"
        )
        db.add(akhil)
        
        db.flush()
        
        # Create Intake records
        sanjeet_intake = OncologyIntake(
            patient_id=sanjeet.id,
            intake_status="INCOMPLETE",
            completion_percentage=0
        )
        db.add(sanjeet_intake)
        
        akhil_intake = OncologyIntake(
            patient_id=akhil.id,
            intake_status="INCOMPLETE",
            completion_percentage=0
        )
        db.add(akhil_intake)

        db.commit()
        print("Successfully created patients Sanjeet and Akhil!")
    except Exception as e:
        print(f"Error creating patients: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_custom_patients()
