from celery import Celery
from app.config import settings

celery_app = Celery(
    "oncology_workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configuration overrides
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Autodiscover tasks from the workers.tasks package
celery_app.autodiscover_tasks(["app.workers"])
