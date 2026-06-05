import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.dependencies import SessionLocal
from app.modules.users.credential_models import AuditLog

def seed_demo_data():
    db = SessionLocal()
    try:
        from app.modules.users.models import User
        users = db.query(User).limit(2).all()
        user_1 = users[0].id if len(users) > 0 else None
        user_2 = users[1].id if len(users) > 1 else user_1
        
        now = datetime.utcnow()
        logs = [
            AuditLog(performed_by=user_1, action="UNAUTHORIZED_ACCESS_ATTEMPT", entity_type="PatientIntake", entity_id=45, details="Receptionist attempted to access highly restricted oncology intake for Patient XYZ", created_at=now - timedelta(minutes=5)),
            AuditLog(performed_by=user_2, action="PHI_VIEWED", entity_type="PathologyReport", entity_id=12, details="Dr. Sanjeet reviewed Imaging Report for Patient #2", created_at=now - timedelta(minutes=15)),
            AuditLog(performed_by=user_1, action="SCHEDULING_OVERRIDE", entity_type="InfusionSession", entity_id=103, details="Admin forced scheduling override despite drug interaction warning (Cleared by Attending)", created_at=now - timedelta(minutes=45)),
            AuditLog(performed_by=user_2, action="LOGIN_SUCCESS", entity_type="DoctorPortal", entity_id=3, details="Dr. Sanjeet logged into portal securely", created_at=now - timedelta(hours=1)),
            AuditLog(performed_by=user_1, action="PHI_VIEWED", entity_type="PatientDemographics", entity_id=8, details="Receptionist accessed general demographics to update insurance", created_at=now - timedelta(hours=2)),
            AuditLog(performed_by=user_1, action="SYSTEM_UPDATE", entity_type="InfusionCenter", entity_id=0, details="ARIA Sync job completed successfully (Pulled 4 active regimens)", created_at=now - timedelta(hours=3)),
            AuditLog(performed_by=user_1, action="API_FAILED", entity_type="ExternalEHR", entity_id=0, details="Temporary HL7 integration timeout (Resolved)", created_at=now - timedelta(hours=4)),
        ]
        
        for log in logs:
            db.add(log)
            
        db.commit()
        print("Demo Audit Logs seeded successfully!")
    except Exception as e:
        print(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
