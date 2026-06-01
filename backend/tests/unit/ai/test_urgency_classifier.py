import pytest
from unittest.mock import MagicMock
from app.modules.ai.classifiers.urgency import UrgencyClassifier
from app.modules.intake.schemas import UrgencyLevel

def test_urgency_classifier(monkeypatch):
    classifier = UrgencyClassifier()
    
    mock_response = '{"urgency_level": "URGENT", "confidence_score": 0.85, "reasoning": "High fever and oncology scheduling rules"}'
    monkeypatch.setattr(classifier, "invoke", MagicMock(return_value=mock_response))

    result = classifier.classify(456, "Notes: Patient exhibits sudden progression.")
    
    assert result.patient_id == 456
    assert result.urgency_level == UrgencyLevel.URGENT
    assert result.confidence_score == 0.85
    assert "High fever" in result.reasoning
