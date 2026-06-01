import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.dependencies import SessionLocal
from app.modules.users.models import User, Role
from app.modules.users.security import get_password_hash

def seed_users():
    db = SessionLocal()
    try:
        users_to_create = [
            {"email": "admin@hospital.com", "full_name": "System Admin", "role": Role.ADMIN, "password": "password123"},
            {"email": "doctor@hospital.com", "full_name": "Dr. Sarah Adams", "role": Role.DOCTOR, "password": "password123"},
            {"email": "receptionist@hospital.com", "full_name": "Mike Frontdesk", "role": Role.RECEPTIONIST, "password": "password123"},
            {"email": "nurse@hospital.com", "full_name": "Nurse Kelly", "role": Role.NURSE, "password": "password123"},
            {"email": "patient@hospital.com", "full_name": "John Doe", "role": Role.PATIENT, "password": "password123"},
        ]

        for u in users_to_create:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_user = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    role=u["role"],
                    hashed_password=get_password_hash(u["password"])
                )
                db.add(new_user)
                print(f"Created user: {u['email']}")
            else:
                print(f"User {u['email']} already exists")
        
        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
