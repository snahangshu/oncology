import pytest
from unittest.mock import MagicMock
from app.modules.ai.optimiser.conflict_explainer import ConflictExplainer

def test_conflict_explainer(monkeypatch):
    explainer = ConflictExplainer()
    
    mock_explanation = "The selected chair 1 is occupied during this time window. Please pick chair 2."
    monkeypatch.setattr(explainer, "invoke", MagicMock(return_value=mock_explanation))

    result = explainer.explain_conflict(
        conflict_details={"chair_id": 1},
        justification="Needs urgent review"
    )
    
    assert "chair 1 is occupied" in result
