import pytest
from datetime import datetime
from app.modules.scheduling.models import Appointment
from app.fhir.mappers.appointment import map_appointment_to_fhir
from app.fhir.mappers.treatment_plan import map_fhir_careplan_to_treatment_plan

def test_map_appointment_to_fhir():
    appointment = Appointment(
        patient_id=10,
        start_time=datetime(2026, 6, 1, 9, 0),
        end_time=datetime(2026, 6, 1, 10, 0),
        status="confirmed",
        specialty="oncology"
    )
    
    fhir_res = map_appointment_to_fhir(appointment)
    
    assert fhir_res["resourceType"] == "Appointment"
    assert fhir_res["status"] == "booked"
    assert "2026-06-01T09:00:00" in fhir_res["start"]
    assert fhir_res["participant"][0]["actor"]["reference"] == "Patient/10"

def test_map_fhir_careplan_to_treatment_plan():
    careplan_payload = {
        "resourceType": "CarePlan",
        "title": "Oncology Regimen",
        "activity": [
            {
                "detail": {
                    "description": "Fluorouracil Infusion",
                    "scheduledTiming": {
                        "repeat": {
                            "duration": 180
                        }
                    }
                }
            }
        ]
    }
    
    plan = map_fhir_careplan_to_treatment_plan(careplan_payload, patient_id=12)
    
    assert plan.patient_id == 12
    assert plan.drug_name == "Fluorouracil Infusion"
    assert plan.duration_minutes == 180
