from datetime import datetime
from typing import Tuple, List, Dict, Optional
from app.modules.ai.classifiers.clinical_alignment import ClinicalAlignmentScorer

class SlotScorer:
    def __init__(self):
        self._alignment_cache: Dict[str, Dict] = {}
        self.alignment_scorer = ClinicalAlignmentScorer()

    def score_slot(
        self,
        patient_id: int,
        slot_start_time: datetime,
        specialty: str,
        urgency_level: str = "ROUTINE",
        primary_diagnosis: str = "",
        doctor_specialty: str = "",
        doctor_id: Optional[int] = None,
        disease_expertise: Optional[List[str]] = None,
        treatment_expertise: Optional[List[str]] = None
    ) -> Tuple[float, str]:
        """
        Calculates a score between 0.0 and 100.0 for a slot.
        Uses ClinicalAlignmentScorer for clinical alignment and applies urgency rules.
        """
        if disease_expertise is None:
            disease_expertise = []
        if treatment_expertise is None:
            treatment_expertise = []

        # Use caching to avoid calling LLM for every single slot of the same doctor
        cache_key = f"{patient_id}_{doctor_id}"
        
        if cache_key in self._alignment_cache:
            alignment = self._alignment_cache[cache_key]
        else:
            alignment = self.alignment_scorer.score_alignment(
                primary_diagnosis=primary_diagnosis,
                urgency_level=urgency_level,
                specialty=doctor_specialty or specialty,
                disease_expertise=disease_expertise,
                treatment_expertise=treatment_expertise
            )
            self._alignment_cache[cache_key] = alignment
            
        base_score = alignment.get("base_score", 50.0)
        reasons = [alignment.get("reasoning", "General alignment.")]

        # Adjust score based on urgency level prioritization
        days_until_slot = (slot_start_time - datetime.utcnow()).days
        if urgency_level == "EMERGENT":
            if days_until_slot <= 1:
                base_score += 35.0
                reasons.append("Emergent priority: slot is within 24 hours.")
            else:
                base_score -= 20.0
                reasons.append("Emergent priority: slot is too far out.")
        elif urgency_level == "URGENT":
            if days_until_slot <= 3:
                base_score += 20.0
                reasons.append("Urgent priority: slot matches 3-day target timeline.")
            else:
                base_score -= 10.0
                reasons.append("Urgent priority: slot falls outside target timeline.")
        else:  # ROUTINE
            if days_until_slot > 3:
                base_score += 10.0
                reasons.append("Routine priority: appropriate scheduling buffer.")
            else:
                base_score += 5.0
                reasons.append("Routine priority: early scheduling.")

        # Limit score bounds
        final_score = max(0.0, min(100.0, base_score))
        reasoning_summary = " ".join(reasons)

        return final_score, reasoning_summary
