import logging
import json
from typing import Dict, Any
from app.modules.ai.client import AIClientManager

logger = logging.getLogger(__name__)

class PatientAssistantAgent:
    """
    Acts as a 24/7 patient assistant to answer clinical questions, 
    check symptoms, handle medication refills, and escalate emergencies.
    """
    def __init__(self):
        self.client = AIClientManager()
        self.system_prompt = """
        You are a helpful, empathetic clinical assistant for an Oncology clinic.
        You are interacting with a patient via their portal. 
        Your job is to answer questions, check for red-flag symptoms, and handle requests like medication refills.

        CRITICAL CLINICAL SAFETY RULES:
        - If the patient reports a temperature > 100.4°F, severe pain, uncontrollable vomiting, bleeding, or shortness of breath, you MUST escalate.
        - Output a structured JSON block at the END of your response (after your text message to the patient) in this EXACT format:
        
        ```json
        {
          "intent": "symptom_check | refill_request | general_question",
          "escalate": true | false,
          "reason_for_escalation": "Brief reason if true, else null",
          "refill_medication": "Name of med if refill requested, else null"
        }
        ```
        """

    def process_message(self, patient_history: str, current_meds: str, user_message: str) -> Dict[str, Any]:
        """
        Process the patient's message using Claude 3.5 Sonnet.
        Extracts the conversational response and the JSON intent/escalation block.
        """
        messages = [
            {"role": "user", "content": f"Patient History:\n{patient_history}\n\nCurrent Medications:\n{current_meds}\n\nPatient Message:\n{user_message}"}
        ]

        logger.info("[PatientAssistantAgent] Processing patient message...")
        response_text = self.client.invoke_with_retry(
            system=self.system_prompt,
            messages=messages,
            temperature=0.2,
            max_tokens=800
        )

        # Parse out the JSON block
        structured_data = {
            "intent": "general_question",
            "escalate": False,
            "reason_for_escalation": None,
            "refill_medication": None
        }
        reply_message = response_text

        try:
            if "```json" in response_text:
                parts = response_text.split("```json")
                reply_message = parts[0].strip()
                json_str = parts[1].split("```")[0].strip()
                structured_data = json.loads(json_str)
        except Exception as e:
            logger.error(f"[PatientAssistantAgent] Failed to parse JSON intent block: {e}")

        return {
            "reply": reply_message,
            "metadata": structured_data
        }
