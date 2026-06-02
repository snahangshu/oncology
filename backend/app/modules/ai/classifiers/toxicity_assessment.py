from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.toxicity_assessment import TOXICITY_ASSESSMENT_SYSTEM, TOXICITY_ASSESSMENT_USER

class ToxicityAssessmentAgent(BaseClassifier):
    def grade_toxicities(self, patient_id: int, clinical_note: str) -> dict:
        """
        Extracts and grades adverse events from clinical notes using CTCAE criteria.
        """
        user_prompt = TOXICITY_ASSESSMENT_USER.format(clinical_note=clinical_note)

        raw_response = self.invoke(TOXICITY_ASSESSMENT_SYSTEM, user_prompt)
        parsed = self.parse_json(raw_response)
        
        self.audit_log("ToxicityAssessmentAgent", patient_id, parsed)
        
        return parsed
