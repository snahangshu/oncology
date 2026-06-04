import logging
import json
from typing import Dict, Any
from app.modules.ai.client import AIClientManager

logger = logging.getLogger(__name__)

class MedicalCodingAgent:
    """
    Analyzes consultation notes to suggest ICD-10 and CPT codes,
    and flags potential claim denial risks based on documentation completeness.
    """
    def __init__(self):
        self.client = AIClientManager()
        self.system_prompt = """
        You are an expert Medical Coder and Billing Analyst for an Oncology practice.
        Your task is to review the doctor's consultation note and output suggested ICD-10 diagnosis codes and CPT procedure codes.
        Additionally, you must flag any missing documentation that could lead to a claim denial.

        Output ONLY a valid JSON object in the following format:
        {
          "icd10_codes": [{"code": "C50.919", "description": "Malignant neoplasm of unspecified site of unspecified female breast"}],
          "cpt_codes": [{"code": "99214", "description": "Office or other outpatient visit"}],
          "denial_risks": ["Missing laterality for breast cancer", "Severity of pain not documented"]
        }
        """

    def process_consultation(self, clinical_note: str) -> Dict[str, Any]:
        """
        Process the clinical note to extract billing codes and risks.
        """
        messages = [
            {"role": "user", "content": f"Clinical Note:\n{clinical_note}"}
        ]

        logger.info("[MedicalCodingAgent] Processing consultation note...")
        response_text = self.client.invoke_with_retry(
            system=self.system_prompt,
            messages=messages,
            temperature=0.0,
            max_tokens=800
        )

        try:
            # Fallback parsing in case the LLM wrapped it in markdown
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].strip()
            else:
                json_str = response_text.strip()
            return json.loads(json_str)
        except Exception as e:
            logger.error(f"[MedicalCodingAgent] Failed to parse JSON: {e}")
            return {
                "icd10_codes": [],
                "cpt_codes": [],
                "denial_risks": ["System error processing codes."]
            }
