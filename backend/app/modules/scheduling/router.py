from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.modules.scheduling.schemas import SlotQuery, SlotOption, SlotConfirmRequest, SlotConfirmResponse
from app.modules.scheduling.service import SchedulingService

router = APIRouter()

@router.get("", response_model=List[SlotOption])
def get_available_slots(
    patient_id: int,
    specialty: str,
    db: Session = Depends(get_db)
):
    """
    Get recommended appointment slots scored by clinical urgency.
    """
    query = SlotQuery(patient_id=patient_id, specialty=specialty)
    service = SchedulingService(db)
    return service.get_scored_slots(query)

@router.post("/confirm", response_model=SlotConfirmResponse)
def confirm_slot(
    request: SlotConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Confirm an appointment slot and sync asynchronously with Varian ARIA.
    """
    service = SchedulingService(db)
    return service.confirm_slot(request)

