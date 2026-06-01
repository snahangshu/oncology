from typing import Dict, Any
from app.modules.scheduling.models import Appointment

def map_appointment_to_fhir(appointment: Appointment) -> Dict[str, Any]:
    """
    Transforms database Appointment into HL7 FHIR R4 Appointment payload.
    """
    return {
        "resourceType": "Appointment",
        "status": "booked" if appointment.status == "confirmed" else "proposed",
        "serviceCategory": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/service-category",
                        "code": "30",
                        "display": "Oncology"
                    }
                ]
            }
        ],
        "specialty": [
            {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "394593009",
                        "display": "Medical oncology"
                    }
                ]
            }
        ],
        "start": appointment.start_time.isoformat(),
        "end": appointment.end_time.isoformat(),
        "participant": [
            {
                "actor": {
                    "reference": f"Patient/{appointment.patient_id}"
                },
                "status": "accepted"
            }
        ],
        "comment": "Scheduled via Oncology AI clinical intake helper."
    }
