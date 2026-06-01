import re
from typing import Dict, Any

# Simple regex patterns for standard PHI markers
PATIENT_ID_PATTERN = re.compile(r"(patient_?id|ssn|dob|phone|email)", re.IGNORECASE)

def redact_phi_fields(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively scans the dictionary and redacts keys that match common PHI signatures.
    """
    redacted = {}
    for k, v in data.items():
        if isinstance(v, dict):
            redacted[k] = redact_phi_fields(v)
        elif isinstance(v, list):
            redacted[k] = [redact_phi_fields(item) if isinstance(item, dict) else item for item in v]
        elif PATIENT_ID_PATTERN.search(k):
            redacted[k] = "[REDACTED_PHI]"
        else:
            redacted[k] = v
    return redacted

def validate_access_token(token: str) -> bool:
    """
    Validates standard authorization token.
    For simulation, returns True if token exists.
    """
    return bool(token)
