from fastapi import APIRouter, Depends
from app.modules.users.models import User, Role
from app.modules.users.auth_deps import require_role

router = APIRouter()

@router.get("/admin", dependencies=[Depends(require_role([Role.ADMIN]))])
def get_admin_dashboard():
    return {
        "today_patients": 45,
        "total_appointments": 120,
        "doctors_available": 12,
        "revenue": 15400,
        "utilization_percent": 85
    }

@router.get("/doctor", dependencies=[Depends(require_role([Role.DOCTOR]))])
def get_doctor_dashboard(current_user: User = Depends(require_role([Role.DOCTOR]))):
    return {
        "today_appointments": [
            {"time": "09:00", "patient_name": "John Doe", "status": "Waiting"},
            {"time": "10:00", "patient_name": "Jane Smith", "status": "Upcoming"}
        ],
        "queue_size": 1
    }

@router.get("/receptionist", dependencies=[Depends(require_role([Role.RECEPTIONIST]))])
def get_receptionist_dashboard():
    return {
        "waiting_patients": 5,
        "doctors_available": 8,
        "upcoming_appointments": 15
    }

@router.get("/nurse", dependencies=[Depends(require_role([Role.NURSE]))])
def get_nurse_dashboard():
    return {
        "pending_vitals": 3,
        "patients_queue": [
            {"patient_name": "John Doe", "status": "Pending Vitals"},
            {"patient_name": "Alice Brown", "status": "Pending Vitals"}
        ]
    }

@router.get("/patient", dependencies=[Depends(require_role([Role.PATIENT]))])
def get_patient_dashboard(current_user: User = Depends(require_role([Role.PATIENT]))):
    return {
        "upcoming_appointments": [
            {"date": "2026-06-15", "doctor": "Dr. Sarah Adams", "department": "Oncology"}
        ],
        "recent_prescriptions": [
            {"date": "2026-05-20", "medication": "Ibuprofen 400mg"}
        ]
    }
