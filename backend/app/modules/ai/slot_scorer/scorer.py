from datetime import datetime
from typing import Tuple

class SlotScorer:
    def score_slot(
        self,
        patient_id: int,
        slot_start_time: datetime,
        specialty: str,
        urgency_level: str = "ROUTINE",
        primary_diagnosis: str = "",
        doctor_specialty: str = ""
    ) -> Tuple[float, str]:
        """
        Calculates a score between 0.0 and 100.0 for a slot.
        Higher score represents better alignment with clinical guidelines and wait time priority.
        """
        score = 50.0  # Base score
        reasons = []

        # 1. Sub-Specialty Alignment
        if primary_diagnosis and doctor_specialty:
            diag_lower = primary_diagnosis.lower()
            spec_lower = doctor_specialty.lower()
            
            # Basic NLP string matching for sub-specialties
            if "breast" in diag_lower and "breast" in spec_lower:
                score += 25.0
                reasons.append("Perfect sub-specialty match (Breast Oncology).")
            elif "lung" in diag_lower and ("thoracic" in spec_lower or "lung" in spec_lower):
                score += 25.0
                reasons.append("Perfect sub-specialty match (Thoracic Oncology).")
            else:
                score += 5.0
                reasons.append("General specialty match.")
        else:
            if specialty.lower() == "oncology" or "oncology" in doctor_specialty.lower():
                score += 15.0
                reasons.append("General specialty alignment (Oncology).")
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
