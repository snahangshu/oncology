from datetime import datetime
from typing import Tuple

class SlotScorer:
    def score_slot(
        self,
        patient_id: int,
        slot_start_time: datetime,
        specialty: str,
        urgency_level: str = "ROUTINE"
    ) -> Tuple[float, str]:
        """
        Calculates a score between 0.0 and 100.0 for a slot.
        Higher score represents better alignment with clinical guidelines and wait time priority.
        """
        score = 50.0  # Base score
        reasons = []

        # 1. Specialty Alignment
        if specialty.lower() == "oncology":
            score += 15.0
            reasons.append("Perfect specialty alignment (Oncology).")
        else:
            score -= 10.0
            reasons.append("Specialty mismatch.")

        # 2. Urgency level prioritization
        days_until_slot = (slot_start_time - datetime.utcnow()).days
        if urgency_level == "EMERGENT":
            if days_until_slot <= 1:
                score += 35.0
                reasons.append("Emergent priority: slot is within 24 hours.")
            else:
                score -= 20.0
                reasons.append("Emergent priority: slot is too far out.")
        elif urgency_level == "URGENT":
            if days_until_slot <= 3:
                score += 20.0
                reasons.append("Urgent priority: slot matches 3-day target timeline.")
            else:
                score -= 10.0
                reasons.append("Urgent priority: slot falls outside target timeline.")
        else:  # ROUTINE
            if days_until_slot > 3:
                score += 10.0
                reasons.append("Routine priority: appropriate scheduling buffer.")
            else:
                score += 5.0
                reasons.append("Routine priority: early scheduling.")

        # Limit score bounds
        final_score = max(0.0, min(100.0, score))
        reasoning_summary = " ".join(reasons)

        return final_score, reasoning_summary
