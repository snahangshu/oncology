import logging
import json
from typing import Dict, Any
from app.modules.ai.client import AIClientManager

logger = logging.getLogger(__name__)

class SurvivorshipAgent:
    """
    Generates a personalized Survivorship Care Plan based on the patient's
    clinical history, treatment summary, and translates it into a target language.
    """
    def __init__(self):
        self.client = AIClientManager()
        self.system_prompt = """
        You are an expert Oncology Nurse Navigator and linguist.
        Generate a patient-friendly Survivorship Care Plan.
        
        The plan should include:
        1. Treatment Summary
        2. Follow-up Schedule
        3. Potential Late Effects to watch for
        4. Healthy Lifestyle Recommendations
        
        You MUST output the plan in the requested language.
        Output ONLY a valid JSON object in the following format:
        {
          "language": "the language it was translated into",
          "treatment_summary": "...",
          "follow_up_schedule": "...",
          "late_effects": "...",
          "lifestyle_recommendations": "..."
        }
        """

    def generate_plan(self, clinical_history: str, treatment_summary: str, language: str) -> Dict[str, Any]:
        """
        Generate survivorship plan.
        """
        messages = [
            {"role": "user", "content": f"Target Language: {language}\n\nClinical History:\n{clinical_history}\n\nTreatment Summary:\n{treatment_summary}"}
        ]

        logger.info(f"[SurvivorshipAgent] Generating plan in {language}...")
        response_text = self.client.invoke_with_retry(
            system=self.system_prompt,
            messages=messages,
            temperature=0.7,
            max_tokens=1500
        )

        try:
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].strip()
            else:
                json_str = response_text.strip()
            return json.loads(json_str)
        except Exception as e:
            logger.error(f"[SurvivorshipAgent] Failed to parse JSON: {e}")
            return {
                "language": language,
                "treatment_summary": "Error generating summary.",
                "follow_up_schedule": "",
                "late_effects": "",
                "lifestyle_recommendations": ""
            }
