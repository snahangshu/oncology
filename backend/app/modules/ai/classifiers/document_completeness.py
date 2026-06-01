from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.document_completeness import DOCUMENT_COMPLETENESS_SYSTEM, DOCUMENT_COMPLETENESS_USER
from app.modules.intake.schemas import CompletenessResult

class DocCompletenessClassifier(BaseClassifier):
    def verify(self, document_id: int, document_text: str) -> CompletenessResult:
        """
        Verify document completeness and extract metadata using Claude.
        """
        # Format the user prompt
        user_prompt = DOCUMENT_COMPLETENESS_USER.format(document_text=document_text)

        # Invoke Claude
        raw_response = self.invoke(DOCUMENT_COMPLETENESS_SYSTEM, user_prompt)

        # Parse JSON output
        parsed = self.parse_json(raw_response)

        # Log action
        self.audit_log("DocCompletenessClassifier", document_id, parsed)

        return CompletenessResult(
            document_id=document_id,
            is_complete=parsed.get("is_complete", False),
            missing_sections=parsed.get("missing_sections", []),
            extracted_metadata=parsed.get("extracted_metadata", {})
        )
