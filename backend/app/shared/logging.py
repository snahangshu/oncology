import json
import logging
from typing import Dict, Any
from app.shared.security import redact_phi_fields

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_payload: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Handle structured data passed in extra
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            # Redact PHI fields
            redacted_extra = redact_phi_fields(record.extra_data)
            log_payload.update(redacted_extra)

        if record.exc_info:
            log_payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_payload)

def setup_structured_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    
    root_logger = logging.getLogger()
    # Remove standard handlers and add structured handler
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)
    
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
