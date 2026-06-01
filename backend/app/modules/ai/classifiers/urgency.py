from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.urgency_classification import URGENCY_SYSTEM, URGENCY_USER
from app.modules.intake.schemas import UrgencyClassificationResponse, UrgencyLevel

class UrgencyClassifier(BaseClassifier):
    def classify(self, patient_id: int, clinical_notes: str) -> UrgencyClassificationResponse:
        """
        Classifies clinical notes into urgency levels using Claude.
        """
        user_prompt = URGENCY_USER.format(clinical_notes=clinical_notes)

        # Invoke Claude
        raw_response = self.invoke(URGENCY_SYSTEM, user_prompt)

        # Parse JSON output
        parsed = self.parse_json(raw_response)

        # Log action
        self.audit_log("UrgencyClassifier", patient_id, parsed)

        level_str = parsed.get("urgency_level", "ROUTINE").upper()
        try:
            urgency_level = UrgencyLevel(level_str)
        except ValueError:
            urgency_level = UrgencyLevel.ROUTINE

        return UrgencyClassificationResponse(
            patient_id=patient_id,
            urgency_level=urgency_level,
            confidence_score=float(parsed.get("confidence_score", 1.0)),
            reasoning=parsed.get("reasoning", "")
        )
