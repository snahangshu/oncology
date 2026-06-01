from dataclasses import dataclass
from datetime import datetime

@dataclass
class NursingRatioConstraint:
    nurse_id: int
    max_patients: int = 2  # Standard oncology 1:2 nursing ratio constraint
    start_time: datetime
    end_time: datetime

@dataclass
class ChairConstraint:
    chair_id: int
    start_time: datetime
    end_time: datetime

@dataclass
class PrepLeadTimeConstraint:
    patient_id: int
    required_lead_time_minutes: int = 30  # Pharmacy preparation time
    treatment_start_time: datetime
