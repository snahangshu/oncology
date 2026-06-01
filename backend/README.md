# Oncology AI Clinical Scheduling & Intake Assistant

A production-grade, clinical AI system designed to streamline patient intake, automate document completeness verification, classify urgency, and optimize infusion chair/nurse allocation.

## Architecture Overview

- **`app/api/`**: Thin HTTP router layer using FastAPI. Contains no business logic.
- **`app/schemas/`**: Pydantic models for request/response validation.
- **`app/models/`**: SQLAlchemy declarative models for PostgreSQL.
- **`app/repositories/`**: Clean data-access layer pattern isolating DB logic.
- **`app/services/`**: Core business domain services orchestrating repository access and external integrations.
- **`app/ai/`**: Isolated AI modules using the Anthropic Claude API for document completeness check, urgency classification, conflict explanations, and slot scoring.
- **`app/ai/optimiser/`**: Google OR-Tools CP-SAT scheduler model satisfying complex clinical constraints (nurse-to-patient ratio, prep lead time, chair availability).
- **`app/fhir/`**: Adapter layer transforming internal data to and from HL7 FHIR R4 resources for Varian ARIA integration.
- **`app/workers/`**: Celery worker tasks for asynchronous operations like document processing, notifications, and FHIR synchronization.
- **`app/realtime/`**: WebSockets and Redis pub/sub mechanism for real-time schedule conflict alerts and heatmaps.

## Setup Instructions

### Prerequisites
- Python 3.11+
- Poetry
- PostgreSQL
- Redis

### Installation
1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   poetry install
   ```
3. Copy environment variables file:
   ```bash
   cp .env.example .env
   ```
4. Run migrations:
   ```bash
   poetry run alembic upgrade head
   ```
5. Start the API server:
   ```bash
   poetry run uvicorn app.main:create_app --reload --factory
   ```
6. Start Celery worker:
   ```bash
   poetry run celery -A app.workers.celery_app worker --loglevel=info
   ```

### Running Tests
To run tests using pytest:
```bash
poetry run pytest
```
