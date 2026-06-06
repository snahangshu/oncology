from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.dependencies import get_db
from app.modules.intake.models import TreatmentPlan, TreatmentCycle

router = APIRouter()

class TreatmentCycleUpdate(BaseModel):
    status: Optional[str] = None
    dose_status: Optional[str] = None
    doctor_clearance: Optional[bool] = None
    notes: Optional[str] = None
    actual_date: Optional[date] = None

class CycleDelayRequest(BaseModel):
    days: int
    reason: Optional[str] = None
    doctor_clearance: Optional[bool] = None
    notes: Optional[str] = None
    actual_date: Optional[date] = None

@router.post("/{plan_id}/generate-cycles")
def generate_cycles(plan_id: int, db: Session = Depends(get_db)):
    """Auto-generate cycles for a treatment plan."""
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
        
    total_cycles = plan.cycles or 1
    existing_cycles = db.query(TreatmentCycle).filter(TreatmentCycle.treatment_plan_id == plan_id).count()
    
    if existing_cycles > 0:
        raise HTTPException(status_code=400, detail="Cycles already generated for this plan")

    start_date = plan.start_date or datetime.utcnow().date()
    
    cycles = []
    for i in range(1, total_cycles + 1):
        # Simplistic spacing for MVP: 21 days between cycles
        scheduled = start_date + timedelta(days=21 * (i - 1))
        
        cycle = TreatmentCycle(
            treatment_plan_id=plan_id,
            cycle_number=i,
            status="PLANNED",
            dose_status="FULL_DOSE",
            scheduled_date=scheduled,
            doctor_clearance=False
        )
        db.add(cycle)
        cycles.append(cycle)
        
    db.commit()
    return {"message": f"{total_cycles} cycles generated successfully"}

@router.get("/{plan_id}/cycles")
def get_plan_cycles(plan_id: int, db: Session = Depends(get_db)):
    """Fetch all cycles for a plan with details."""
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
        
    cycles = db.query(TreatmentCycle).filter(TreatmentCycle.treatment_plan_id == plan_id).order_by(TreatmentCycle.cycle_number).all()
    
    return {
        "plan": {
            "id": plan.id,
            "regimen": plan.regimen_name,
            "total_cycles": plan.cycles,
            "completed_cycles": sum(1 for c in cycles if c.status == "COMPLETED"),
            "upcoming_cycles": sum(1 for c in cycles if c.status in ["PLANNED", "SCHEDULED", "CLEARED"]),
            "delayed_cycles": sum(1 for c in cycles if c.status == "DELAYED" or c.dose_status == "DELAYED"),
            "status": plan.status
        },
        "cycles": [
            {
                "id": c.id,
                "cycle_number": c.cycle_number,
                "status": c.status,
                "dose_status": c.dose_status,
                "scheduled_date": c.scheduled_date,
                "actual_date": c.actual_date,
                "chair_id": c.chair_id,
                "doctor_clearance": c.doctor_clearance,
                "notes": c.notes,
                "events": [
                    {
                        "id": e.id,
                        "event_type": e.event_type,
                        "event_time": e.event_time,
                        "notes": e.notes
                    } for e in c.events
                ] if hasattr(c, 'events') else []
            } for c in cycles
        ]
    }

@router.put("/cycles/{cycle_id}")
def update_cycle(cycle_id: int, update: TreatmentCycleUpdate, db: Session = Depends(get_db)):
    """Update cycle status or dose details."""
    cycle = db.query(TreatmentCycle).filter(TreatmentCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
        
    if update.status is not None:
        cycle.status = update.status
        if update.status == "COMPLETED" and not cycle.actual_date:
            cycle.actual_date = datetime.utcnow().date()
    if update.dose_status is not None:
        cycle.dose_status = update.dose_status
    if update.doctor_clearance is not None:
        cycle.doctor_clearance = update.doctor_clearance
    if update.notes is not None:
        cycle.notes = update.notes
    if update.actual_date is not None:
        cycle.actual_date = update.actual_date
        
    db.commit()
    
    # Update plan current cycle logic
    if cycle.status == "COMPLETED":
        plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == cycle.treatment_plan_id).first()
        if plan:
            plan.current_cycle = cycle.cycle_number
            db.commit()
            
    return {"message": "Cycle updated successfully", "status": cycle.status}

@router.post("/cycles/{cycle_id}/delay")
def delay_cycle_cascade(cycle_id: int, request: CycleDelayRequest, db: Session = Depends(get_db)):
    """Delay a cycle by X days and cascade the shift to all subsequent cycles."""
    cycle = db.query(TreatmentCycle).filter(TreatmentCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
        
    plan_id = cycle.treatment_plan_id
    
    # Update the target cycle's status
    cycle.status = "DELAYED"
    if request.reason:
        cycle.notes = f"Delayed by {request.days} days: {request.reason}"
    else:
        cycle.notes = f"Delayed by {request.days} days"
        
    # Find all cycles from this cycle onwards
    subsequent_cycles = db.query(TreatmentCycle).filter(
        TreatmentCycle.treatment_plan_id == plan_id,
        TreatmentCycle.cycle_number >= cycle.cycle_number
    ).order_by(TreatmentCycle.cycle_number).all()
    
    # Shift dates
    for sc in subsequent_cycles:
        if sc.scheduled_date:
            sc.scheduled_date = sc.scheduled_date + timedelta(days=request.days)
            
    db.commit()
    return {"message": f"Cycle {cycle.cycle_number} and all subsequent cycles delayed by {request.days} days."}
