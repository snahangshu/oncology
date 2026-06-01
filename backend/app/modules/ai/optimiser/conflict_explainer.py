import json
from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.conflict_explanation import CONFLICT_SYSTEM, CONFLICT_USER

class ConflictExplainer(BaseClassifier):
    def explain_conflict(self, conflict_details: dict, justification: str) -> str:
        """
        Translates raw constraint conflict data and clinician overrides into friendly natural language.
        """
        # Format the user prompt
        user_prompt = CONFLICT_USER.format(
            conflict_details=json.dumps(conflict_details),
            justification=justification
        )

        try:
            # Invoke Claude and return the text explanation directly
            explanation = self.invoke(CONFLICT_SYSTEM, user_prompt)
            return explanation.strip()
        except Exception as e:
            # Fallback natural language explanation if API fails
            return (
                f"The requested slot conflicts with existing chair assignments for chair "
                f"{conflict_details.get('chair_id', 'unknown')}. "
                f"Justification provided: '{justification}' could not bypass this safety check."
            )
        
        # Override audit log is handled by the caller service.
