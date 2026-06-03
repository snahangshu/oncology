import sys
import os
from datetime import time

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.dependencies import SessionLocal
from app.modules.doctors.models import Doctor, DoctorSchedule, DoctorCapacityProfile

def seed_doctors():
    db = SessionLocal()
    try:
        doctors_data = [
            {"first": "Sarah", "last": "Adams", "email": "doctor@hospital.com", "phone": "555-0001", "specialty": "Medical Oncology", "new_cap": 2, "follow_cap": 10},
            {"first": "Michael", "last": "Smith", "email": "msmith@hospital.com", "phone": "555-0002", "specialty": "Medical Oncology", "new_cap": 6, "follow_cap": 20},
            {"first": "Emily", "last": "Chen", "email": "echen@hospital.com", "phone": "555-0003", "specialty": "Radiation Oncology", "new_cap": 4, "follow_cap": 15},
            {"first": "David", "last": "Patel", "email": "dpatel@hospital.com", "phone": "555-0004", "specialty": "Breast Oncology", "new_cap": 5, "follow_cap": 15},
        ]

        for d_data in doctors_data:
            doc = db.query(Doctor).filter(Doctor.email == d_data["email"]).first()
            if not doc:
                doc = Doctor(
                    first_name=d_data["first"],
                    last_name=d_data["last"],
                    email=d_data["email"],
                    phone=d_data["phone"],
                    specialty=d_data["specialty"],
                    status="active"
                )
                db.add(doc)
                db.flush()
                print(f"Created Doctor: Dr. {doc.last_name}")
                
                # Add schedule (Mon-Fri, 9am - 5pm)
                for day in range(5):  # 0 to 4 (Mon to Fri)
                    sched = DoctorSchedule(
                        doctor_id=doc.id,
                        day_of_week=day,
                        start_time=time(9, 0),
                        end_time=time(17, 0),
                        is_recurring=True
                    )
                    db.add(sched)
                
                # Add capacity profile
                cap = DoctorCapacityProfile(
                    doctor_id=doc.id,
                    max_new_consults_per_day=d_data["new_cap"],
                    max_follow_ups_per_day=d_data["follow_cap"]
                )
                db.add(cap)
                print(f"  Added schedules and capacity for Dr. {doc.last_name}")
            else:
                print(f"Doctor {d_data['email']} already exists.")
        
        db.commit()
        print("Database doctors seeded successfully!")
    except Exception as e:
        print(f"Error seeding doctors: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_doctors()
