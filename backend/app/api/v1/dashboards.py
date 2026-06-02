from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.users.models import User, Role
from app.modules.users.auth_deps import require_role
from app.modules.intake.models import Patient, OncologyIntake
from app.modules.doctors.models import Doctor
from app.modules.scheduling.models import Appointment
from datetime import datetime, date, time

router = APIRouter()

@router.get("/admin", dependencies=[Depends(require_role([Role.ADMIN]))])
def get_admin_dashboard(db: Session = Depends(get_db)):
    return {
        "today_patients": 45,
        "total_appointments": 120,
        "doctors_available": db.query(Doctor).filter(Doctor.status == "active").count(),
        "revenue": 15400,
        "utilization_percent": 85
    }

@router.get("/doctor", dependencies=[Depends(require_role([Role.DOCTOR]))])
def get_doctor_dashboard(current_user: User = Depends(require_role([Role.DOCTOR])), db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.email == current_user.email).first()
    if not doctor:
        return {"today_appointments": [], "queue_size": 0}
        
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.start_time >= today_start,
        Appointment.start_time <= today_end
    ).order_by(Appointment.start_time.asc()).all()
    
    result = []
    for appt in appointments:
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == appt.patient_id).first()
        
        pat_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown"
        primary_dx = patient.primary_diagnosis if patient else "Unknown"
        urgency = patient.urgency_level if patient else "ROUTINE"
        
        intake_summary = {}
        if intake:
            if intake.referral_letter: intake_summary['referral_letter'] = intake.referral_letter
            if intake.pathology_report: intake_summary['pathology_report'] = intake.pathology_report
            if intake.imaging_report: intake_summary['imaging_report'] = intake.imaging_report
            
        result.append({
            "appointment_id": appt.id,
            "time": appt.start_time.strftime("%H:%M"),
            "full_time": appt.start_time.isoformat(),
            "patient_name": pat_name,
            "patient_id": appt.patient_id,
            "status": appt.status,
            "primary_diagnosis": primary_dx,
            "urgency_level": urgency,
            "intake_summary": intake_summary
        })
        
    return {
        "today_appointments": result,
        "queue_size": len([a for a in result if a['status'] in ['waiting', 'confirmed']])
    }

@router.get("/receptionist", dependencies=[Depends(require_role([Role.RECEPTIONIST]))])
def get_receptionist_dashboard(db: Session = Depends(get_db)):
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    
    # Query all appointments for today
    appointments = db.query(Appointment).filter(
        Appointment.start_time >= today_start,
        Appointment.start_time <= today_end
    ).order_by(Appointment.start_time.asc()).all()
    
    result = []
    waiting_list = []
    for appt in appointments:
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        
        pat_name = f"{patient.first_name} {patient.last_name}" if patient else "Unknown"
        doc_name = f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown"
        
        appt_data = {
            "id": appt.id,
            "time": appt.start_time.strftime("%I:%M %p"),
            "patient": pat_name,
            "doctor": f"Dr. {doc_name}",
            "status": appt.status.capitalize()
        }
        
        result.append(appt_data)
        
        if appt.status == "waiting":
            waiting_list.append({
                "id": appt.id,
                "name": pat_name,
                "type": "Scheduled",
                "waitTime": "N/A",
                "status": "Waiting"
            })
    
    doctors_available = db.query(Doctor).filter(Doctor.status == "active").count()

    return {
        "waiting_patients": waiting_list,
        "doctors_available": doctors_available,
        "today_appointments": result,
        "total_upcoming": len(result)
    }

@router.get("/nurse", dependencies=[Depends(require_role([Role.NURSE]))])
def get_nurse_dashboard(db: Session = Depends(get_db)):
    return {
        "pending_vitals": 3,
        "patients_queue": [
            {"patient_name": "John Doe", "status": "Pending Vitals"},
            {"patient_name": "Alice Brown", "status": "Pending Vitals"}
        ]
    }

@router.get("/patient", dependencies=[Depends(require_role([Role.PATIENT]))])
def get_patient_dashboard(current_user: User = Depends(require_role([Role.PATIENT])), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == current_user.email).first()
    if not patient:
        return {"upcoming_appointments": [], "recent_prescriptions": []}
        
    now = datetime.utcnow()
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient.id,
        Appointment.start_time >= now
    ).order_by(Appointment.start_time.asc()).limit(5).all()
    
    result = []
    for appt in appointments:
        doc = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        doc_name = f"{doc.first_name} {doc.last_name}" if doc else "Unassigned Provider"
        
        result.append({
            "appointment_id": appt.id,
            "start_time": appt.start_time.isoformat(),
            "specialty": appt.specialty,
            "doctor_name": doc_name,
            "status": appt.status
        })

    return {
        "upcoming_appointments": result,
        "recent_prescriptions": []
    }
