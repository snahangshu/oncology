from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.drug_safety import DRUG_SAFETY_SYSTEM, DRUG_SAFETY_USER

class DrugSafetyAgent(BaseClassifier):
    def assess_safety(
        self, patient_id: int, proposed_regimen: str, allergies: str, current_meds: str, renal_function: str, hepatic_function: str
    ) -> dict:
        """
        Cross-references a proposed medication regimen against patient safety metrics.
        """
        user_prompt = DRUG_SAFETY_USER.format(
            proposed_regimen=proposed_regimen,
            allergies=allergies,
            current_meds=current_meds,
            renal_function=renal_function,
            hepatic_function=hepatic_function
        )

        raw_response = self.invoke(DRUG_SAFETY_SYSTEM, user_prompt)
        parsed = self.parse_json(raw_response)
        
        self.audit_log("DrugSafetyAgent", patient_id, parsed)
        
        return parsed
