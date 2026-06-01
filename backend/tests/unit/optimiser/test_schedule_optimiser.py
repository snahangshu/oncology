import pytest
from app.modules.ai.optimiser.schedule_optimiser import ScheduleOptimiser

def test_schedule_optimiser():
    optimiser = ScheduleOptimiser()
    result = optimiser.optimise_schedule(patient_id=789)
    
    assert result["success"] is True
    assert len(result["assignments"]) == 1
    assignment = result["assignments"][0]
    assert "chair_id" in assignment
    assert "nurse_id" in assignment
    assert assignment["start_time"] < assignment["end_time"]
