from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.users.models import User, Role
from app.modules.users.auth_deps import require_role
from app.modules.intake.models import Patient, OncologyIntake, InsuranceRecord
from app.modules.doctors.models import Doctor
from app.modules.scheduling.models import Appointment
from datetime import datetime, date, time, timedelta
import random

router = APIRouter()

@router.get("/admin/credentialing", dependencies=[Depends(require_role([Role.ADMIN]))])
def get_credentialing_dashboard(db: Session = Depends(get_db)):
    from app.modules.users.credential_models import StaffDocument, DocumentStatus
    
    # Calculate simple stats
    pending_count = db.query(StaffDocument).filter(StaffDocument.status == DocumentStatus.PENDING_REVIEW).count()
    expired_count = db.query(StaffDocument).filter(StaffDocument.status == DocumentStatus.EXPIRED).count()
    
    # Check expiring soon (within 30 days)
    thirty_days = datetime.utcnow().date() + timedelta(days=30)
    expiring_soon = db.query(StaffDocument).filter(
        StaffDocument.status == DocumentStatus.VERIFIED,
        StaffDocument.expiry_date <= thirty_days,
        StaffDocument.expiry_date >= datetime.utcnow().date()
    ).count()

    return {
        "pending_reviews": pending_count,
        "expired_documents": expired_count,
        "expiring_soon": expiring_soon
    }

@router.get("/admin", dependencies=[Depends(require_role([Role.ADMIN]))])
def get_admin_dashboard(db: Session = Depends(get_db)):
    users = db.query(User).all()
    users_data = []
    for u in users:
        users_data.append({
            "id": u.id,
            "name": u.full_name,
            "email": u.email,
            "role": u.role.value if u.role else "UNKNOWN",
            "status": "Active" if u.is_active else "Inactive",
            "verification_status": u.verification_status.value if u.verification_status else "APPROVED",
            "patients": 0,
            "lastActive": "Just now"
        })

    # For system events, fetch recent audit logs or return empty
    from app.modules.users.credential_models import AuditLog
    recent_audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(5).all()
    system_events = []
    for a in recent_audits:
        system_events.append({
            "id": a.id,
            "type": "info",
            "message": f"{a.action} on {a.entity_type} {a.entity_id}: {a.details or ''}",
            "time": a.created_at.strftime("%I:%M %p") if a.created_at else "Just now"
        })

    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    yesterday_start = today_start - timedelta(days=1)
    yesterday_end = today_end - timedelta(days=1)
    
    # Calculate real today's patients (unique patients with appointments today)
    today_appts = db.query(Appointment).filter(
        Appointment.start_time >= today_start,
        Appointment.start_time <= today_end
    ).all()
    today_patients = len(set(a.patient_id for a in today_appts))

    yesterday_appts = db.query(Appointment).filter(
        Appointment.start_time >= yesterday_start,
        Appointment.start_time <= yesterday_end
    ).all()
    yesterday_patients = len(set(a.patient_id for a in yesterday_appts))

    def calc_change_str(curr, prev, is_percent=True):
        if prev == 0:
            return f"+{curr}%" if is_percent else f"+{curr}"
        diff = curr - prev
        pct = int((diff / prev) * 100)
        return f"+{pct}%" if pct >= 0 else f"{pct}%"

    today_patients_change = calc_change_str(today_patients, yesterday_patients)
    
    # Calculate total appointments
    total_appointments = db.query(Appointment).count()
    last_30_start = today_start - timedelta(days=30)
    prev_30_start = last_30_start - timedelta(days=30)
    appts_last_30 = db.query(Appointment).filter(Appointment.created_at >= last_30_start).count()
    appts_prev_30 = db.query(Appointment).filter(Appointment.created_at >= prev_30_start, Appointment.created_at < last_30_start).count()
    total_appointments_change = calc_change_str(appts_last_30, appts_prev_30)
    
    doctors_available = db.query(Doctor).filter(Doctor.status == "active").count()
    doctors_available_change = "+0"

    from app.modules.scheduling.models import SlotAvailability
    total_slots_today = db.query(SlotAvailability).filter(
        SlotAvailability.start_time >= today_start,
        SlotAvailability.start_time <= today_end
    ).count()
    booked_slots_today = db.query(SlotAvailability).filter(
        SlotAvailability.start_time >= today_start,
        SlotAvailability.start_time <= today_end,
        SlotAvailability.is_booked == True
    ).count()

    if total_slots_today > 0:
        utilization_percent = int((booked_slots_today / total_slots_today) * 100)
    else:
        # Fallback
        utilization_percent = min(int((len(today_appts) / max(doctors_available * 8, 1)) * 100), 100)

    utilization_percent_change = "+0%"

    return {
        "today_patients": today_patients,
        "today_patients_change": today_patients_change,
        "total_appointments": total_appointments,
        "total_appointments_change": total_appointments_change,
        "doctors_available": doctors_available,
        "doctors_available_change": doctors_available_change,
        "revenue": 0,
        "utilization_percent": utilization_percent,
        "utilization_percent_change": utilization_percent_change,
        "users": users_data,
        "systemEvents": system_events
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
            "appointment_id": str(appt.id),
            "patient_id": str(appt.patient_id),
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "time": appt.start_time.strftime("%I:%M %p"),
            "date": appt.start_time.strftime("%b %d, %Y"),
            "full_time": appt.start_time.isoformat(),
            "status": appt.status,
            "urgency_level": getattr(patient, 'urgency_level', 'Routine') if patient else 'Routine',
            "primary_diagnosis": getattr(patient, 'primary_diagnosis', None) or 'Unknown',
            "patient_comments": getattr(patient, 'patient_comments', None) or 'No additional comments provided.',
            "vitals": {
                "bp": f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                "hr": str(random.randint(65, 95)),
                "temp": f"{round(random.uniform(97.8, 99.1), 1)}°F",
                "weight": f"{random.randint(140, 190)} lbs"
            },
            "intake_summary": intake_summary,
            "ai_summary": intake.ai_summary if intake and intake.ai_summary else f"AI Summary based on Intake: Patient presents with {getattr(patient, 'primary_diagnosis', 'Unknown') if patient else 'Unknown'}. Intake documents include: {', '.join(intake_summary.keys()) or 'None'}."
        })
        
    upcoming_appts = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.start_time > today_end
    ).order_by(Appointment.start_time.asc()).limit(10).all()
    
    upcoming_result = []
    for appt in upcoming_appts:
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        intake = db.query(OncologyIntake).filter(OncologyIntake.patient_id == appt.patient_id).first()
        
        intake_summary = {}
        if intake:
            if intake.referral_letter: intake_summary['referral_letter'] = intake.referral_letter
            if intake.pathology_report: intake_summary['pathology_report'] = intake.pathology_report
            if intake.imaging_report: intake_summary['imaging_report'] = intake.imaging_report
            
        upcoming_result.append({
            "appointment_id": str(appt.id),
            "patient_id": str(appt.patient_id),
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "date": appt.start_time.strftime("%b %d, %Y"),
            "time": appt.start_time.strftime("%I:%M %p"),
            "full_time": appt.start_time.isoformat(),
            "status": appt.status,
            "primary_diagnosis": getattr(patient, 'primary_diagnosis', None) or 'Unknown',
            "patient_comments": getattr(patient, 'patient_comments', None) or 'No additional comments provided.',
            "vitals": {
                "bp": f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                "hr": str(random.randint(65, 95)),
                "temp": f"{round(random.uniform(97.8, 99.1), 1)}°F",
                "weight": f"{random.randint(140, 190)} lbs"
            },
            "urgency_level": getattr(patient, 'urgency_level', 'Routine') if patient else 'Routine',
            "intake_summary": intake_summary,
            "ai_summary": getattr(intake, 'ai_summary', None) if intake else None or f"AI Summary based on Intake: Patient presents with {getattr(patient, 'primary_diagnosis', 'Unknown') if patient else 'Unknown'}. Intake documents include: {', '.join(intake_summary.keys()) or 'None'}."
        })

    from app.modules.scheduling.models import ClinicalAlert
    unresolved_alerts = db.query(ClinicalAlert).filter(ClinicalAlert.is_resolved == False).all()
    alerts_result = []
    for alert in unresolved_alerts:
        pat = db.query(Patient).filter(Patient.id == alert.patient_id).first()
        alerts_result.append({
            "id": alert.id,
            "patient_name": f"{pat.first_name} {pat.last_name}" if pat else "Unknown",
            "type": alert.alert_type,
            "severity": alert.severity,
            "message": alert.message,
            "created_at": alert.created_at.isoformat() if alert.created_at else None
        })

    return {
        "doctor_id": doctor.id,
        "today_appointments": result,
        "upcoming_appointments": upcoming_result,
        "queue_size": len([a for a in result if a['status'] in ['waiting', 'confirmed']]),
        "clinical_alerts": alerts_result
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
    
    upcoming_appts = db.query(Appointment).filter(
        Appointment.start_time > today_end
    ).order_by(Appointment.start_time.asc()).limit(10).all()
    
    upcoming_result = []
    for appt in upcoming_appts:
        patient = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
        upcoming_result.append({
            "id": appt.id,
            "date": appt.start_time.strftime("%b %d, %Y"),
            "time": appt.start_time.strftime("%I:%M %p"),
            "patient": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "doctor": f"Dr. {doctor.last_name}" if doctor else "Unknown",
            "status": appt.status.capitalize()
        })

    doctors_available = db.query(Doctor).filter(Doctor.status == "active").count()

    return {
        "waiting_patients": waiting_list,
        "doctors_available": doctors_available,
        "today_appointments": result,
        "upcoming_appointments": upcoming_result,
        "total_upcoming": len(result) + len(upcoming_result)
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
        "doctors": [{"id": str(d.id), "name": f"Dr. {d.first_name} {d.last_name}", "specialty": d.specialty if getattr(d, 'specialty', None) else "Oncology"} for d in doctors]
    }
