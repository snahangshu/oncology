import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.dependencies import SessionLocal
from app.modules.doctors.models import Doctor, DoctorCapacityProfile

def seed_capacities():
    db = SessionLocal()
    try:
        doctors = db.query(Doctor).all()
        
        if not doctors:
            print("No doctors found to seed.")
            return

        for index, doc in enumerate(doctors):
            # Check if profile already exists
            existing = db.query(DoctorCapacityProfile).filter(DoctorCapacityProfile.doctor_id == doc.id).first()
            
            # Create varied limits depending on the doctor to demonstrate flexibility
            # Doctor 1: Low new consults (e.g., senior specialist)
            # Doctor 2: High new consults (e.g., junior attending)
            new_consult_limit = 2 if index % 2 == 0 else 8
            follow_up_limit = 10 if index % 2 == 0 else 20
            
            if existing:
                existing.max_new_consults_per_day = new_consult_limit
                existing.max_follow_ups_per_day = follow_up_limit
                print(f"Updated {doc.first_name} {doc.last_name}: max_new={new_consult_limit}, max_follow={follow_up_limit}")
            else:
                profile = DoctorCapacityProfile(
                    doctor_id=doc.id,
                    max_new_consults_per_day=new_consult_limit,
                    max_follow_ups_per_day=follow_up_limit
                )
                db.add(profile)
                print(f"Created for {doc.first_name} {doc.last_name}: max_new={new_consult_limit}, max_follow={follow_up_limit}")
                
        db.commit()
        print("Capacity profiles successfully seeded!")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_capacities()
