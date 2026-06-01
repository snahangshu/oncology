from typing import Dict, Any
from app.modules.infusion.schemas import TreatmentPlan

def map_fhir_careplan_to_treatment_plan(careplan: Dict[str, Any], patient_id: int) -> TreatmentPlan:
    """
    Maps HL7 FHIR R4 CarePlan resource fields to our internal TreatmentPlan schema.
    """
    # Parse basic details from the FHIR CarePlan resource
    title = careplan.get("title", "Standard Infusion Therapy")
    
    # Try to extract drug details from activity
    drug_name = "Chemotherapy"
    duration = 120
    
    activities = careplan.get("activity", [])
    if activities:
        detail = activities[0].get("detail", {})
        drug_name = detail.get("description", drug_name)
        # Parse duration from quantity if present
        quantity = detail.get("scheduledTiming", {}).get("repeat", {}).get("duration", 120)
        duration = int(quantity)

    return TreatmentPlan(
        patient_id=patient_id,
        drug_name=drug_name,
        dosage="Standard Protocol Dose",
        cycle_number=1,
        duration_minutes=duration,
        prep_lead_time_minutes=30
    )
