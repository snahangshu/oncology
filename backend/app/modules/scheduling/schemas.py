from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SlotQuery(BaseModel):
    patient_id: int
    specialty: str
    appointment_type: str = Field(default="initial-consult", description="initial-consult, follow-up, infusion, etc.")
    preferred_start_date: Optional[datetime] = None
    preferred_end_date: Optional[datetime] = None

class SlotOption(BaseModel):
    slot_id: str = Field(..., description="Unique slot identifier")
    doctor_id: int
    doctor_name: str
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None
    start_time: datetime
    end_time: datetime
    score: float = Field(..., description="Weighted score from Slot Scorer (0 to 100)")
    reasoning: str = Field(..., description="Explanation of why this slot was scored this way")

class SlotConfirmRequest(BaseModel):
    patient_id: int
    slot_id: str
    doctor_id: int
    start_time: datetime
    end_time: datetime
    force_overbook: bool = Field(default=False, description="Bypass slot checks for emergency overrides")

class SlotConfirmResponse(BaseModel):
    appointment_id: int
    status: str = Field("confirmed")
    scheduled_time: datetime
    fhir_synced: bool = False
