import logging
from typing import Dict, Any
from app.fhir.client import FHIRClient
from app.fhir.mappers.treatment_plan import map_fhir_careplan_to_treatment_plan
from app.modules.infusion.schemas import TreatmentPlan

logger = logging.getLogger(__name__)

class FHIRReader:
    def __init__(self):
        self.client = FHIRClient()

    async def get_patient_demographics(self, fhir_patient_id: str) -> Dict[str, Any]:
        """Reads patient resource from FHIR server."""
        resource = await self.client.get_resource("Patient", fhir_patient_id)
        # Parse basic name and DOB
        name_info = resource.get("name", [{}])[0]
        given_name = " ".join(name_info.get("given", []))
        family_name = name_info.get("family", "")

        return {
            "first_name": given_name,
            "last_name": family_name,
            "date_of_birth": resource.get("birthDate"),
            "gender": resource.get("gender")
        }

    async def get_treatment_plan(self, fhir_care_plan_id: str, patient_id: int) -> TreatmentPlan:
        """Reads a CarePlan resource from FHIR server and maps it to a TreatmentPlan."""
        resource = await self.client.get_resource("CarePlan", fhir_care_plan_id)
        return map_fhir_careplan_to_treatment_plan(resource, patient_id)
