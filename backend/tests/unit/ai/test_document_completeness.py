import pytest
from unittest.mock import MagicMock
from app.modules.ai.classifiers.document_completeness import DocCompletenessClassifier

def test_doc_completeness_classifier(monkeypatch):
    classifier = DocCompletenessClassifier()
    
    # Mock self.invoke directly on the instance
    mock_response = '{"is_complete": true, "missing_sections": [], "extracted_metadata": {"patient_name": "Jane Doe"}}'
    monkeypatch.setattr(classifier, "invoke", MagicMock(return_value=mock_response))

    result = classifier.verify(123, "Pathology Report: Patient Jane Doe has stage II carcinoma.")
    
    assert result.document_id == 123
    assert result.is_complete is True
    assert len(result.missing_sections) == 0
    assert result.extracted_metadata["patient_name"] == "Jane Doe"

