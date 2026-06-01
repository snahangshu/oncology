from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.comms_agent import COMMS_AGENT_SYSTEM, COMMS_AGENT_USER

class CommsAgent(BaseClassifier):
    def draft_missing_docs_message(
        self, patient_id: int, recipient: str, patient_name: str, missing_docs: str, reason_needed: str
    ) -> dict:
        """
        Drafts a message requesting missing clinical documents.
        """
        user_prompt = COMMS_AGENT_USER.format(
            recipient=recipient,
            patient_name=patient_name,
            missing_docs=missing_docs,
            reason_needed=reason_needed
        )

        raw_response = self.invoke(COMMS_AGENT_SYSTEM, user_prompt)
        parsed = self.parse_json(raw_response)
        
        self.audit_log("CommsAgent", patient_id, parsed)
        
        return parsed
