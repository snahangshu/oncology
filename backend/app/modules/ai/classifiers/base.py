import json
import logging
from typing import Dict, Any
from app.modules.ai.client import AIClientManager

logger = logging.getLogger(__name__)

class BaseClassifier:
    def __init__(self):
        self.client_manager = AIClientManager()

    def invoke(self, system_prompt: str, user_prompt: str) -> str:
        """Invokes AI (Claude primary, OpenAI fallback) with standard settings."""
        try:
            return self.client_manager.invoke_with_retry(
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                temperature=0.0
            )
        except Exception as e:
            logger.error(f"Error invoking AI client: {e}")
            raise e

    def parse_json(self, response_text: str) -> Dict[str, Any]:
        """Utility to extract JSON from Claude responses."""
        # Find JSON boundaries if Claude wraps in markdown code blocks
        clean_text = response_text.strip()
        if "```json" in clean_text:
            clean_text = clean_text.split("```json")[1].split("```")[0].strip()
        elif "```" in clean_text:
            clean_text = clean_text.split("```")[1].split("```")[0].strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {response_text}")
            raise e

    def audit_log(self, classifier_name: str, entity_id: int, payload: Dict[str, Any]):
        """Standard log tracking for classifications."""
        logger.info(f"[AUDIT] {classifier_name} executed for Entity ID {entity_id}. Result: {payload}")
