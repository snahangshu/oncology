import sys
import os

sys.path.append(os.getcwd())

from app.dependencies import SessionLocal
from app.modules.scheduling.models import Appointment
from app.modules.intake.models import Patient
from app.modules.doctors.models import Doctor
from app.modules.users.models import User
import datetime

db = SessionLocal()

appts = db.query(Appointment).filter(Appointment.id.in_([2, 3, 4])).all()
for appt in appts:
    patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
    # It's possible patient is None if patient_id doesn't link to a Patient
    is_sanjeet = patient and 'sanjeet' in patient.first_name.lower()
    
    if is_sanjeet:
        # Keep this one at June 5, 17:40
        appt.start_time = datetime.datetime(2026, 6, 5, 17, 40)
        appt.end_time = datetime.datetime(2026, 6, 5, 18, 40)
        print(f"Kept Appt {appt.id} for Sanjeet at Jun 5 17:40")
    else:
        # Restore original times based on ID
        if appt.id == 2:
            appt.start_time = datetime.datetime(2026, 6, 8, 11, 0)
            appt.end_time = datetime.datetime(2026, 6, 8, 12, 0)
        elif appt.id == 3:
            appt.start_time = datetime.datetime(2026, 6, 9, 9, 0)
            appt.end_time = datetime.datetime(2026, 6, 9, 10, 0)
        elif appt.id == 4:
            appt.start_time = datetime.datetime(2026, 6, 9, 13, 0)
            appt.end_time = datetime.datetime(2026, 6, 9, 14, 0)
        print(f"Restored Appt {appt.id} to {appt.start_time}")

db.commit()
print("Restored successfully.")
