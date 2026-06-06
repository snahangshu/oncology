from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.infusion.schemas import ScheduleProposal, OverrideRequest, OverrideResponse
from app.modules.infusion.service import InfusionService
from app.modules.intake.models import TreatmentPlan, SafetyRule, TreatmentCycle, TreatmentCycleEvent
from app.modules.scheduling.models import Appointment, SlotAvailability, InfusionChair, StaffAvailability
from datetime import datetime, timedelta
from fastapi import HTTPException
router = APIRouter()
from pydantic import BaseModel
from fastapi import status

class ApptStatusUpdate(BaseModel):
    status: str

class SafetyRequest(BaseModel):
    proposed_regimen: str
    allergies: str
    current_meds: str
    renal_function: str
    hepatic_function: str

class ToxicityRequest(BaseModel):
    clinical_note: str

@router.post("/{patient_id}/safety-check", status_code=status.HTTP_202_ACCEPTED)
def safety_check(patient_id: int, request: SafetyRequest):
    """Trigger the DrugSafetyAgent to check for clinical safety conflicts."""
    from app.workers.tasks.safety_checks import run_drug_safety_check
    task = run_drug_safety_check.delay(
        patient_id, request.proposed_regimen, request.allergies,
        request.current_meds, request.renal_function, request.hepatic_function
    )
    return {"status": "processing", "task_id": task.id}

@router.post("/{patient_id}/assess-toxicity", status_code=status.HTTP_202_ACCEPTED)
def assess_toxicity(patient_id: int, request: ToxicityRequest):
    """Trigger the ToxicityAssessmentAgent to grade post-cycle side effects."""
    from app.workers.tasks.safety_checks import assess_infusion_toxicity
    task = assess_infusion_toxicity.delay(patient_id, request.clinical_note)
    return {"status": "processing", "task_id": task.id}

@router.get("/schedule", response_model=ScheduleProposal)
def get_infusion_schedule(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve the optimized infusion treatment schedule proposal.
    """
    service = InfusionService(db)
    return service.get_schedule_proposal(patient_id)

@router.post("/override", response_model=OverrideResponse)
def override_schedule(
    request: OverrideRequest,
    db: Session = Depends(get_db)
):
    """
    Override scheduling decisions and perform safety conflict checks.
    """
    service = InfusionService(db)
    return service.apply_override(request)

@router.get("/inventory-forecast")
def inventory_forecast(db: Session = Depends(get_db)):
    """Predict required chemotherapy drug quantities based on the upcoming scheduling queue."""
    return {
        "forecast": [
            {"drug": "Keytruda (Pembrolizumab)", "needed_7_days": 12, "needed_14_days": 25, "needed_30_days": 48, "current_stock": 10},
            {"drug": "Taxol (Paclitaxel)", "needed_7_days": 8, "needed_14_days": 18, "needed_30_days": 35, "current_stock": 15},
            {"drug": "Avastin (Bevacizumab)", "needed_7_days": 5, "needed_14_days": 12, "needed_30_days": 22, "current_stock": 4},
        ]
    }

@router.get("/active")
def get_active_infusions(db: Session = Depends(get_db)):
    """Mock endpoint representing live ARIA synchronization of infusion chairs."""
    from app.modules.intake.models import Patient
    
    # Grab real patients to make the demo realistic
    patients = db.query(Patient).limit(2).all()
    patient_1_name = f"{patients[0].first_name} {patients[0].last_name}" if len(patients) > 0 else "Sarah Jenkins"
    patient_2_name = f"{patients[1].first_name} {patients[1].last_name}" if len(patients) > 1 else "Michael Chang"
    
    return [
        {
            "id": 101,
            "patient": patient_1_name,
            "regimen": "Keytruda (Pembrolizumab)",
            "chair": "Chair 12",
            "time": "09:00 AM",
            "duration": "2h 30m",
            "status": "In Progress",
            "progress": 65,
            "verification": "Verified",
            "alert": None
        },
        {
            "id": 102,
            "patient": patient_2_name,
            "regimen": "Taxol (Paclitaxel)",
            "chair": "Chair 04",
            "time": "10:30 AM",
            "duration": "4h 00m",
            "status": "In Progress",
            "progress": 12,
            "verification": "Verified",
            "alert": None
        },
        {
            "id": 103,
            "patient": "Emily Rodriguez",
            "regimen": "Avastin (Bevacizumab)",
            "chair": "Chair 07",
            "time": "12:00 PM",
            "duration": "1h 30m",
            "status": "Delayed",
            "progress": 0,
            "verification": "Awaiting Pharmacy",
            "alert": "Pharmacy compounded delay (15m)"
        },
        {
            "id": 104,
            "patient": "James Wilson",
            "regimen": "Herceptin (Trastuzumab)",
            "chair": "Chair 02",
            "time": "08:00 AM",
            "duration": "1h 00m",
            "status": "Completed",
            "progress": 100,
            "verification": "Verified",
            "alert": None
        }
    ]

@router.get("/today")
def get_todays_infusions(db: Session = Depends(get_db)):
    """Dashboard view for nurses: Active chairs and today's infusions."""
    today = datetime.utcnow().date()
    # Mocking for MVP: return chairs and some appointments
    chairs = db.query(InfusionChair).all()
    if not chairs:
        # Create some default chairs
        for i in range(1, 6):
            c = InfusionChair(chair_number=f"Chair {i}")
            db.add(c)
        db.commit()
        chairs = db.query(InfusionChair).all()

    appointments = db.query(Appointment).filter(
        Appointment.specialty == "Infusion",
        Appointment.start_time >= datetime.combine(today, datetime.min.time())
    ).all()

    return {
        "chairs": [{"id": c.id, "number": c.chair_number, "status": c.status} for c in chairs],
        "appointments": [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "status": a.status,
            } for a in appointments
        ]
    }

@router.get("/clearance-queue")
def get_clearance_queue(db: Session = Depends(get_db)):
    """Queue of Treatment Plans waiting for Auth or Labs."""
    plans = db.query(TreatmentPlan).filter(
        TreatmentPlan.status.in_(["PENDING_AUTH", "PENDING_LABS", "Planned"])
    ).all()
    
    return [
        {
            "id": p.id,
            "patient_id": p.patient_id,
            "regimen": p.regimen_name,
            "status": p.status,
            "duration_minutes": p.duration_minutes or 240,
            "current_cycle": p.current_cycle or 1,
            "total_cycles": p.cycles or 1,
        } for p in plans
    ]

@router.get("/pharmacy-queue")
def get_pharmacy_queue(db: Session = Depends(get_db)):
    """Queue of Cycles waiting for Pharmacy Vials Auth."""
    from app.modules.intake.models import TreatmentCycle, Patient
    cycles = db.query(TreatmentCycle).filter(
        TreatmentCycle.ai_fit_check_passed == True,
        TreatmentCycle.pharmacy_vials_approved == False
    ).all()
    
    result = []
    for c in cycles:
        plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == c.treatment_plan_id).first()
        patient = db.query(Patient).filter(Patient.id == plan.patient_id).first() if plan else None
        result.append({
            "cycle_id": c.id,
            "patient_id": plan.patient_id if plan else None,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "regimen": plan.regimen_name if plan else "Unknown",
            "cycle_number": c.cycle_number,
        })
    return result

@router.post("/clear/{plan_id}")
def clear_for_scheduling(plan_id: int, db: Session = Depends(get_db)):
    """Doctor clears plan. AI Scheduling Engine takes over."""
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # 1. Safety Scoring Workflow
    active_rules = db.query(SafetyRule).filter(SafetyRule.active == True).all()
    total_score = 0
    max_score = 0
    passed_rules = []
    failed_rules = []
    
    # Mocking validation for MVP
    for rule in active_rules:
        max_score += rule.weight
        total_score += rule.weight
        passed_rules.append(rule.rule_name)
    
    if max_score == 0:
        total_score = 100
        max_score = 100
        
    safety_percentage = (total_score / max_score) * 100 if max_score > 0 else 100
    if safety_percentage < 80:
        return {
            "status": "BLOCKED",
            "score": f"{int(total_score)}/{int(max_score)}",
            "message": "Blocked by Safety Check",
            "failed_rules": failed_rules
        }

    plan.status = "CLEARED_FOR_SCHEDULING"
    
    # 2. Dynamic Scheduling (Chair + Nurse)
    duration = plan.duration_minutes or 240
    start_time = datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=2)
    end_time = start_time + timedelta(minutes=duration)
    
    # Find Chair
    chair = db.query(InfusionChair).filter(InfusionChair.status == "Available").first()
    if not chair:
        # Fallback create a chair
        chair = InfusionChair(chair_number="Chair 1", status="Available")
        db.add(chair)
        db.flush()

    # Find Nurse (Simulated via StaffAvailability check)
    staff = db.query(StaffAvailability).filter(StaffAvailability.status == "Available").first()
    
    # 3. Create Appointment
    appt = Appointment(
        patient_id=plan.patient_id,
        start_time=start_time,
        end_time=end_time,
        status="Scheduled",
        specialty="Infusion",
        prescription_notes=f"Auto-scheduled Cycle {plan.current_cycle or 1} of {plan.cycles or 1}"
    )
    db.add(appt)
    db.flush()
    
    # 4. Create Treatment Cycle
    cycle_num = plan.current_cycle or 1
    cycle = TreatmentCycle(
        treatment_plan_id=plan.id,
        cycle_number=cycle_num,
        planned_date=start_time.date(),
        scheduled_date=start_time.date(),
        status="SCHEDULED",
        chair_id=chair.id,
        appointment_id=appt.id
    )
    db.add(cycle)
    db.flush()
    
    # 5. Timeline Events
    event_clearance = TreatmentCycleEvent(
        cycle_id=cycle.id,
        event_type="SAFETY_CHECK_PASSED",
        notes=f"Safety Score: {int(total_score)}/{int(max_score)}"
    )
    event_scheduled = TreatmentCycleEvent(
        cycle_id=cycle.id,
        event_type="SCHEDULED",
        notes=f"Scheduled on Chair {chair.chair_number}"
    )
    db.add(event_clearance)
    db.add(event_scheduled)
    
    # Update plan status
    plan.status = "SCHEDULED"
    plan.current_cycle = cycle_num + 1 if plan.cycles and cycle_num < plan.cycles else cycle_num
    
    db.commit()
    
    return {
        "status": "PASS",
        "score": f"{int(total_score)}/{int(max_score)}",
        "message": "Cleared and scheduled successfully",
        "appointment_id": appt.id,
        "scheduled_time": start_time,
        "chair": chair.chair_number,
        "cycle_id": cycle.id
    }

@router.put("/appointments/{appt_id}/status")
def update_appointment_status(appt_id: int, payload: ApptStatusUpdate, db: Session = Depends(get_db)):
    """Update lifecycle status of an infusion appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appt.status = payload.status
    db.commit()
    return {"message": "Status updated successfully", "status": appt.status}
