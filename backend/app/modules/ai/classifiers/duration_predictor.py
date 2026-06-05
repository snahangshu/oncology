import json
from typing import Dict, Any
from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.duration_prediction import DURATION_SYSTEM_PROMPT, DURATION_USER_PROMPT

class DurationPredictor(BaseClassifier):
    def predict_duration(
        self,
        primary_diagnosis: str,
        patient_comments: str,
        appointment_type: str
    ) -> Dict[str, Any]:
        """
        Predicts the required appointment duration in minutes based on clinical complexity.
        """
        user_prompt = DURATION_USER_PROMPT.format(
            primary_diagnosis=primary_diagnosis or "None provided",
            patient_comments=patient_comments or "None provided",
            appointment_type=appointment_type or "Unknown"
        )
        
        try:
            response_text = self.invoke(
                system_prompt=DURATION_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            parsed = self.parse_json(response_text)
            
            duration = int(parsed.get("recommended_duration_minutes", 15))
            # Ensure it's a multiple of 15 and at least 15
            duration = max(15, (duration // 15) * 15)
            
            reasoning = parsed.get("reasoning", "Fallback duration applied.")
            
            return {
                "recommended_duration_minutes": duration,
                "reasoning": reasoning
            }
        except Exception as e:
            # Fallback logic based on appointment type if AI fails
            fallback = 15
            if appointment_type == "initial-consult":
                fallback = 60
            elif appointment_type == "infusion":
                fallback = 30
                
            return {
                "recommended_duration_minutes": fallback,
                "reasoning": f"Failed to predict duration: {str(e)}. Using fallback."
            }
