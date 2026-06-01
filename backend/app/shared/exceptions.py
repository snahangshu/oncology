class OncologyAIException(Exception):
    """Base exception for all domain-specific errors."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

class UrgencyEscalationRequired(OncologyAIException):
    """
    Raised when a patient's urgency classification warrants an immediate escalation
    to clinical directors / emergency pathways.
    """
    def __init__(self, patient_id: int, reason: str):
        self.patient_id = patient_id
        super().__init__(f"Clinical urgency escalation required for Patient {patient_id}. Reason: {reason}")

class DocGateBlocked(OncologyAIException):
    """
    Raised when critical scheduling functions are requested but the clinical
    document gate is blocked (due to missing pathology or staging records).
    """
    def __init__(self, patient_id: int, missing_sections: list):
        self.patient_id = patient_id
        self.missing_sections = missing_sections
        super().__init__(
            f"Scheduling gate blocked for Patient {patient_id}. Missing mandatory documentation: {missing_sections}"
        )
