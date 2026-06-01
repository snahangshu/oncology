import logging
from typing import Dict, Any
from app.fhir.client import FHIRClient
from app.fhir.mappers.appointment import map_appointment_to_fhir
from app.modules.scheduling.models import Appointment

logger = logging.getLogger(__name__)

class FHIRWriter:
    def __init__(self):
        self.client = FHIRClient()

    async def write_appointment(self, appointment: Appointment) -> str:
        """
        Maps a database Appointment to a FHIR Appointment resource and
        posts it to the Varian ARIA FHIR server. Returns the server-assigned FHIR resource ID.
        """
        fhir_payload = map_appointment_to_fhir(appointment)
        
        response = await self.client.post_resource("Appointment", fhir_payload)
        fhir_id = response.get("id")
        logger.info(f"Successfully synchronized appointment to ARIA. FHIR ID: {fhir_id}")
        return str(fhir_id)

    async def write_infusion_schedule(self, schedule_details: Dict[str, Any]) -> str:
        """
        Pushes the finalized infusion scheduling details (chair, nurse assignments)
        to ARIA FHIR backend as a Schedule/Encounter resource.
        """
        # Map internally and post
        fhir_payload = {
            "resourceType": "Schedule",
            "actor": [
                {"reference": f"Device/chair-{schedule_details.get('chair_id')}"},
                {"reference": f"Practitioner/nurse-{schedule_details.get('nurse_id')}"}
            ],
            "planningHorizon": {
                "start": schedule_details.get("start_time"),
                "end": schedule_details.get("end_time")
            },
            "comment": "Auto-scheduled by Oncology AI optimizer."
        }
        response = await self.client.post_resource("Schedule", fhir_payload)
        return str(response.get("id"))
