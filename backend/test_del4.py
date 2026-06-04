import sys
sys.path.append('c:\\Users\\sanjeet kumar\\Desktop\\DoortwoFy\\oncology\\backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.modules.doctors.models import DoctorSchedule
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

schedules = db.query(DoctorSchedule).filter(DoctorSchedule.doctor_id == 2).all()
for s in schedules:
    print(f"ID={s.id}, day={s.day_of_week}, recurring={s.is_recurring}")
