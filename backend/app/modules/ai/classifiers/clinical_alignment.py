import json
from typing import Dict, Any, List
from app.modules.ai.classifiers.base import BaseClassifier
from app.modules.ai.prompts.clinical_alignment import CLINICAL_ALIGNMENT_PROMPT

class ClinicalAlignmentScorer(BaseClassifier):
    def score_alignment(
        self,
        primary_diagnosis: str,
        urgency_level: str,
        specialty: str,
        disease_expertise: List[str],
        treatment_expertise: List[str]
    ) -> Dict[str, Any]:
        
        user_prompt = f"""
Patient Information:
- Primary Diagnosis: {primary_diagnosis}
- Urgency Level: {urgency_level}

Doctor Information:
- General Specialty: {specialty}
- Disease Expertise: {', '.join(disease_expertise) if disease_expertise else 'None specified'}
- Treatment Expertise: {', '.join(treatment_expertise) if treatment_expertise else 'None specified'}
"""
        try:
            response_text = self.invoke(
                system_prompt=CLINICAL_ALIGNMENT_PROMPT,
                user_prompt=user_prompt
            )
            parsed = self.parse_json(response_text)
            
            base_score = float(parsed.get("base_score", 50.0))
            reasoning = parsed.get("reasoning", "Fallback score applied due to parsing issues.")
            
            return {
                "base_score": base_score,
                "reasoning": reasoning
            }
        except Exception as e:
            return {
                "base_score": 50.0,
                "reasoning": f"Failed to compute clinical alignment: {str(e)}"
            }
