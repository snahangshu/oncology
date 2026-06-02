from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.treatment_plan import TREATMENT_PLAN_SYSTEM, TREATMENT_PLAN_USER

class TreatmentPlanStructurer(BaseClassifier):
    def structure_plan(self, patient_id: int, clinical_note: str) -> dict:
        """
        Structures an oncologist's free-text clinical decision into a structured treatment plan.
        """
        user_prompt = TREATMENT_PLAN_USER.format(clinical_note=clinical_note)

        raw_response = self.invoke(TREATMENT_PLAN_SYSTEM, user_prompt)
        parsed = self.parse_json(raw_response)
        
        self.audit_log("TreatmentPlanStructurer", patient_id, parsed)
        
        return parsed
