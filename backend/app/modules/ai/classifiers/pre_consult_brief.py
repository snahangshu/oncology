from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.pre_consult_brief import PRE_CONSULT_BRIEF_SYSTEM, PRE_CONSULT_BRIEF_USER

class PreConsultBriefAgent(BaseClassifier):
    def generate_brief(
        self, patient_id: int, patient_name: str, diagnosis: str, clinical_history: str, recent_labs: str, imaging_reports: str
    ) -> dict:
        """
        Generates a concise pre-consultation brief for the oncologist.
        """
        user_prompt = PRE_CONSULT_BRIEF_USER.format(
            patient_name=patient_name,
            diagnosis=diagnosis,
            clinical_history=clinical_history,
            recent_labs=recent_labs,
            imaging_reports=imaging_reports
        )

        raw_response = self.invoke(PRE_CONSULT_BRIEF_SYSTEM, user_prompt)
        parsed = self.parse_json(raw_response)
        
        self.audit_log("PreConsultBriefAgent", patient_id, parsed)
        
        return parsed
