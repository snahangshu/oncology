from app.dependencies import engine
from sqlalchemy import text

with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    print("Deleting child records for all doctors and patients...")
    
    tables_to_clear = [
        "appointments",
        "doctor_schedules",
        "slot_availability",
        "oncology_intakes",
        "insurance_records",
        "patient_treatments"
    ]
    
    for table in tables_to_clear:
        try:
            conn.execute(text(f"DELETE FROM {table}"))
        except Exception as e:
            # Table might not exist, skip safely
            pass

    print("Deleting all doctors and patients from their respective tables...")
    try:
        conn.execute(text("DELETE FROM patients"))
    except Exception as e:
        print("Failed to clear patients:", e)
        
    try:
        conn.execute(text("DELETE FROM doctors"))
    except Exception as e:
        print("Failed to clear doctors:", e)
    
    print("Deleting DOCTOR and PATIENT accounts from users table...")
    try:
        conn.execute(text("DELETE FROM users WHERE role IN ('DOCTOR', 'PATIENT')"))
    except Exception as e:
        print("Failed to delete from users:", e)

    print("Successfully deleted all doctor and patient data!")
