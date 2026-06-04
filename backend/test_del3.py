import sys
sys.path.append('c:\\Users\\sanjeet kumar\\Desktop\\DoortwoFy\\oncology\\backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.modules.doctors.models import DoctorSchedule
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

schedule = db.query(DoctorSchedule).filter(DoctorSchedule.id == 6).first()
if schedule:
    print(f"FOUND: ID={schedule.id}, doctor_id={schedule.doctor_id}")
else:
    print("NOT FOUND")
