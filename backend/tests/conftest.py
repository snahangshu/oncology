import pytest
from unittest.mock import MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.shared.base_model import Base
from app.modules.ai.client import AnthropicClientManager
from app.workers.celery_app import celery_app

# Import models to ensure they are registered for test DB setup
import app.modules.intake.models
import app.modules.scheduling.models
import app.modules.infusion.models
import app.modules.audit.models

# Enable Celery synchronous execution for unit/integration tests
celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True

# Set up SQLite in-memory database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override SessionLocal globally for tests
import app.dependencies
import app.workers.tasks.fhir_sync
import app.workers.tasks.document_processing
app.dependencies.SessionLocal = TestingSessionLocal
app.workers.tasks.fhir_sync.SessionLocal = TestingSessionLocal
app.workers.tasks.document_processing.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Provides a transactional database session for a single test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(autouse=True)
def mock_anthropic_client(monkeypatch):
    """Mocks AnthropicClientManager to avoid real API calls during test suite run."""
    mock_manager = MagicMock()
    # Stub response matching standard JSON formats
    mock_manager.invoke_with_retry.return_value = '{"is_complete": true, "urgency_level": "URGENT", "confidence_score": 0.9, "reasoning": "Test reasoning"}'
    
    # Patch the _instance class attribute of AnthropicClientManager
    monkeypatch.setattr(AnthropicClientManager, "_instance", mock_manager)
    return mock_manager

@pytest.fixture(autouse=True)
def mock_fhir_client(monkeypatch):
    """Globally mocks FHIRClient network operations to prevent real HTTP requests during testing."""
    from app.fhir.client import FHIRClient

    async def mock_post(self, resource_type: str, payload: dict):
        return {"id": "mock-fhir-id-999"}

    async def mock_get(self, resource_type: str, resource_id: str):
        return {
            "id": resource_id,
            "resourceType": resource_type,
            "name": [{"family": "Smith", "given": ["John"]}],
            "birthDate": "1975-04-10",
            "activity": [
                {
                    "detail": {
                        "description": "Mock Chemotherapy Protocol",
                        "scheduledTiming": {"repeat": {"duration": 120}}
                    }
                }
            ]
        }

    monkeypatch.setattr(FHIRClient, "post_resource", mock_post)
    monkeypatch.setattr(FHIRClient, "get_resource", mock_get)

