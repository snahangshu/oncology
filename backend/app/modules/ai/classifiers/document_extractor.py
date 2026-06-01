from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.document_completeness import DOCUMENT_COMPLETENESS_SYSTEM, DOCUMENT_COMPLETENESS_USER
from app.modules.intake.schemas import CompletenessResult

class DocumentExtractor(BaseClassifier):
    def check_completeness(self, document_id: int, document_text: str) -> CompletenessResult:
        """
        Analyzes document text to verify completeness of required sections.
        """
        user_prompt = DOCUMENT_COMPLETENESS_USER.format(document_text=document_text)

        # Invoke Claude
        raw_response = self.invoke(DOCUMENT_COMPLETENESS_SYSTEM, user_prompt)

        # Parse JSON output
        parsed = self.parse_json(raw_response)

        # Log action
        self.audit_log("DocumentExtractor", document_id, parsed)

        return CompletenessResult(
            document_id=document_id,
            is_complete=parsed.get("is_complete", False),
            missing_sections=parsed.get("missing_sections", []),
            extracted_metadata=parsed.get("extracted_metadata", {})
        )
