from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.insurance_auth import INSURANCE_AUTH_SYSTEM, INSURANCE_AUTH_USER

class InsuranceAuthAgent(BaseClassifier):
    def extract_auth_details(self, document_id: int, document_text: str) -> dict:
        """
        Extracts insurance authorization details from a document.
        """
        user_prompt = INSURANCE_AUTH_USER.format(document_text=document_text)

        raw_response = self.invoke(INSURANCE_AUTH_SYSTEM, user_prompt)
        parsed = self.parse_json(raw_response)
        
        self.audit_log("InsuranceAuthAgent", document_id, parsed)
        
        return parsed
