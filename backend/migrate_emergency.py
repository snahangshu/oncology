import sys
sys.path.append('c:\\Users\\sanjeet kumar\\Desktop\\DoortwoFy\\oncology\\backend')

from sqlalchemy import create_engine
from app.config import settings
from app.shared.base_model import Base
from app.modules.doctors.models import DoctorEmergencyBlock

engine = create_engine(settings.DATABASE_URL)
DoctorEmergencyBlock.__table__.create(bind=engine, checkfirst=True)
print("Created doctor_emergency_blocks table")
