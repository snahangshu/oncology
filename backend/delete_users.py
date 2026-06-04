from app.dependencies import engine
from sqlalchemy import text

with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    print("Deleting child records...")
    
    tables_to_clear = [
        "appointments",
        "doctor_schedules",
        "slot_availability",
        "oncology_intakes",
        "insurance_records"
    ]
    
    for table in tables_to_clear:
        try:
            conn.execute(text(f"DELETE FROM {table} WHERE patient_id = 1 OR doctor_id = 1"))
        except Exception as e:
            try:
                conn.execute(text(f"DELETE FROM {table} WHERE patient_id = 1"))
            except:
                pass
            try:
                conn.execute(text(f"DELETE FROM {table} WHERE doctor_id = 1"))
            except:
                pass

    print("Deleting from doctors and patients...")
    try:
        conn.execute(text("DELETE FROM patients WHERE id = 1"))
    except Exception as e:
        print("Failed to delete patient:", e)
        
    try:
        conn.execute(text("DELETE FROM doctors WHERE id = 1"))
    except Exception as e:
        print("Failed to delete doctor:", e)
    
    print("Deleting from users...")
    try:
        conn.execute(text("DELETE FROM users WHERE email IN ('jane.doe@oncologyai.com', 'xyz@gmail.com')"))
    except Exception as e:
        print("Failed to delete users:", e)
    print("Deleted successfully!")
