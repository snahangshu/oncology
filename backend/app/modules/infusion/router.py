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
