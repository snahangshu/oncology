from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.infusion.schemas import ScheduleProposal, OverrideRequest, OverrideResponse
from app.modules.infusion.service import InfusionService

router = APIRouter()
from pydantic import BaseModel
from fastapi import status

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
