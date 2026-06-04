from app.dependencies import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("--- DOCTORS ---")
    doctors = conn.execute(text("SELECT id, email, first_name, last_name FROM doctors")).fetchall()
    print(f"Total registered doctors: {len(doctors)}")
    for doc in doctors:
        print(f"ID: {doc[0]}, Name: {doc[2]} {doc[3]}, Email: {doc[1]}")
    
    print("\n--- PATIENTS ---")
    patients = conn.execute(text("SELECT id, first_name, last_name, email FROM patients")).fetchall()
    print(f"Total registered patients: {len(patients)}")
    for pat in patients:
        print(f"ID: {pat[0]}, Name: {pat[1]} {pat[2]}, Email: {pat[3]}")
