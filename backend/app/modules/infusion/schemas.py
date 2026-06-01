from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TreatmentPlan(BaseModel):
    patient_id: int
    drug_name: str
    dosage: str
    cycle_number: int
    duration_minutes: int
    prep_lead_time_minutes: int = Field(default=30)

class ProposedAssignment(BaseModel):
    chair_id: int
    nurse_id: int
    start_time: datetime
    end_time: datetime

class ScheduleProposal(BaseModel):
    patient_id: int
    proposal_id: str
    assignments: List[ProposedAssignment]
    constraints_satisfied: bool
    creation_time: datetime

class OverrideRequest(BaseModel):
    patient_id: int
    chair_id: int
    nurse_id: int
    start_time: datetime
    end_time: datetime
    justification: str = Field(..., min_length=10, description="Clinical justification for override")

class OverrideResponse(BaseModel):
    success: bool
    conflict_detected: bool
    conflict_description: Optional[str] = None
    override_id: Optional[int] = None
