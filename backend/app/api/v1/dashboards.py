from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.users.models import User, Role
from app.modules.users.auth_deps import require_role
from app.modules.intake.models import Patient, OncologyIntake, InsuranceRecord
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

@router.get("/receptionist/registry", dependencies=[Depends(require_role([Role.RECEPTIONIST, Role.ADMIN]))])
def get_patient_registry(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    result = []
    for p in patients:
        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == p.id).first()
        intake_prog = f"{intake.completion_percentage // 25}/4" if intake else "0/4"
        
        # Get next appt
        next_appt = db.query(Appointment).filter(
            Appointment.patient_id == p.id,
            Appointment.start_time > datetime.now()
        ).order_by(Appointment.start_time.asc()).first()
        
        if next_appt:
            appt_str = next_appt.start_time.strftime("%b %d, %Y")
        else:
            appt_str = "Unscheduled"
            
        status = "Active Treatment"
        if not intake or intake.intake_status == "INCOMPLETE":
            status = "Pending Intake"
        elif not next_appt:
            status = "Awaiting Scheduling"
            
        result.append({
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}",
            "mrn": f"MRN-{p.id:04d}",
            "diagnosis": p.primary_diagnosis or "Pending Diagnosis",
            "intake": intake_prog,
            "nextAppointment": appt_str,
            "status": status
        })
    return result

@router.get("/receptionist/intakes", dependencies=[Depends(require_role([Role.RECEPTIONIST, Role.ADMIN]))])
def get_intake_management(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    result = []
    for p in patients:
        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == p.id).first()
        if not intake:
            continue
            
        result.append({
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}",
            "referral": bool(intake.referral_letter),
            "pathology": bool(intake.pathology_report),
            "imaging": bool(intake.imaging_report),
            "insurance": bool(intake.insurance_authorization),
            "status": "Completed" if intake.completion_percentage == 100 else ("Urgent Case" if p.urgency_level == "High" else "Incomplete")
        })
    return result

@router.get("/receptionist/referrals", dependencies=[Depends(require_role([Role.RECEPTIONIST, Role.ADMIN]))])
def get_referrals_queue(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    result = []
    for p in patients:
        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == p.id).first()
        if not intake:
            continue
            
        ref_doc = "External Provider"
        if intake.referral_letter and isinstance(intake.referral_letter, dict):
            ref_doc = intake.referral_letter.get("provider", "Dr. Sharma (External)")
            
        status = "Ready For Intake"
        if not intake.pathology_report:
            status = "Awaiting Pathology"
        elif not intake.imaging_report:
            status = "Awaiting Imaging"
        elif intake.completion_percentage == 100:
            status = "Ready For Scheduling"
            
        result.append({
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}",
            "referringDoctor": ref_doc,
            "referralDate": p.created_at.strftime("%b %d, %Y") if p.created_at else date.today().strftime("%b %d, %Y"),
            "status": status
        })
    return result

@router.get("/receptionist/waiting-room", dependencies=[Depends(require_role([Role.RECEPTIONIST, Role.ADMIN]))])
def get_waiting_room(db: Session = Depends(get_db)):
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    
    appts = db.query(Appointment).filter(
        Appointment.start_time >= today_start,
        Appointment.start_time <= today_end
    ).order_by(Appointment.start_time.asc()).all()
    
    result = []
    for a in appts:
        p = db.query(Patient).filter(Patient.id == a.patient_id).first()
        doc = db.query(Doctor).filter(Doctor.id == a.doctor_id).first()
        
        wait_mins = 0
        if a.status == "waiting":
            wait_mins = int((datetime.now() - a.start_time).total_seconds() / 60)
            if wait_mins < 0: wait_mins = 0
            
        result.append({
            "id": a.id,
            "name": f"{p.first_name} {p.last_name}" if p else "Unknown",
            "doctor": f"Dr. {doc.last_name}" if doc else "Unassigned",
            "time": a.start_time.strftime("%I:%M %p"),
            "status": a.status.title() if a.status else "Scheduled",
            "waitMinutes": wait_mins
        })
    return result

@router.get("/receptionist/insurance", dependencies=[Depends(require_role([Role.RECEPTIONIST, Role.ADMIN]))])
def get_insurance_auth(db: Session = Depends(get_db)):
    records = db.query(InsuranceRecord).all()
    result = []
    for r in records:
        p = db.query(Patient).filter(Patient.id == r.patient_id).first()
        result.append({
            "id": r.id,
            "name": f"{p.first_name} {p.last_name}" if p else "Unknown",
            "provider": r.provider_name,
            "type": r.request_type or "Prior Auth (General)",
            "status": r.auth_status or "Pending",
            "expiry": r.expiry_date.strftime("%b %d, %Y") if r.expiry_date else "N/A"
        })
    return result

@router.get("/receptionist/scheduling-options", dependencies=[Depends(require_role([Role.RECEPTIONIST, Role.ADMIN]))])
def get_scheduling_options(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    doctors = db.query(Doctor).all()
    
    return {
        "patients": [{"id": str(p.id), "name": f"{p.first_name} {p.last_name}", "mrn": f"MRN-{p.id:04d}"} for p in patients],
        "doctors": [{"id": str(d.id), "name": f"Dr. {d.first_name} {d.last_name}", "specialty": d.specialties[0] if d.specialties else "Oncology"} for d in doctors]
    }
