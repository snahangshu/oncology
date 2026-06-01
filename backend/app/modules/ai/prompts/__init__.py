# Prompts package marker
from app.modules.ai.prompts.document_completeness import DOCUMENT_COMPLETENESS_SYSTEM, DOCUMENT_COMPLETENESS_USER
from app.modules.ai.prompts.urgency_classification import URGENCY_SYSTEM, URGENCY_USER
from app.modules.ai.prompts.conflict_explanation import CONFLICT_SYSTEM, CONFLICT_USER

__all__ = [
    "DOCUMENT_COMPLETENESS_SYSTEM",
    "DOCUMENT_COMPLETENESS_USER",
    "URGENCY_SYSTEM",
    "URGENCY_USER",
    "CONFLICT_SYSTEM",
    "CONFLICT_USER",
]
