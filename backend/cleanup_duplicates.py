from app.dependencies import SessionLocal
from app.modules.intake.models import TreatmentPlan
import app.modules.scheduling.models  # to fix sqlalchemy mapper dependencies

db = SessionLocal()

# Find all treatment plans
plans = db.query(TreatmentPlan).all()

# Group by patient_id and regimen_name
seen = {}
duplicates = []

for p in plans:
    key = (p.patient_id, p.regimen_name)
    if key in seen:
        duplicates.append(p)
    else:
        # keep the oldest or whichever we saw first
        seen[key] = p

print(f"Found {len(duplicates)} duplicate plans.")

for d in duplicates:
    db.delete(d)

db.commit()
print("Duplicates removed.")
