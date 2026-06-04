import json
from typing import Dict, Any
from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.infusion_requirements import INFUSION_REQ_SYSTEM_PROMPT, INFUSION_REQ_USER_PROMPT

class InfusionRequirementsAnalyzer(BaseClassifier):
    def analyze_requirements(
        self,
        primary_diagnosis: str,
        patient_comments: str
    ) -> Dict[str, Any]:
        """
        Predicts if a patient needs a specialized nurse or a bed (instead of a chair) for infusion.
        """
        user_prompt = INFUSION_REQ_USER_PROMPT.format(
            primary_diagnosis=primary_diagnosis or "None provided",
            patient_comments=patient_comments or "None provided"
        )
        
        try:
            response_text = self.invoke(
                system_prompt=INFUSION_REQ_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            parsed = self.parse_json(response_text)
            
            return {
                "requires_specialist_nurse": bool(parsed.get("requires_specialist_nurse", False)),
                "requires_bed": bool(parsed.get("requires_bed", False)),
                "reasoning": parsed.get("reasoning", "Fallback applied.")
            }
        except Exception as e:
            return {
                "requires_specialist_nurse": False,
                "requires_bed": False,
                "reasoning": f"Failed to analyze requirements: {str(e)}. Using fallback."
            }
