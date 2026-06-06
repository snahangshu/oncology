import sys
import os

sys.path.append(os.getcwd())

from app.dependencies import SessionLocal
from app.modules.scheduling.models import Appointment
from app.modules.doctors.models import Doctor
from app.modules.users.models import User
import datetime

db = SessionLocal()

# We know Appointment 2 is the one for Sanjeet on Mon, Jun 8 11:00 AM
appt = db.query(Appointment).filter(Appointment.id == 2).first()
if appt:
    print(f"Found appt: {appt.start_time}")
    appt.start_time = datetime.datetime(2026, 6, 5, 17, 50)
    appt.end_time = datetime.datetime(2026, 6, 5, 18, 50)
    db.commit()
    print("Successfully updated Sanjeet's appointment to June 5, 5:50 PM!")
else:
    print("Appt 2 not found.")
