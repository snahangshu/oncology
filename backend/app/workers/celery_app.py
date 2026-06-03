from celery import Celery
from app.config import settings

celery_app = Celery(
    "oncology_workers",
    broker="memory://",
    backend="cache+memory://"
)

# Configuration overrides
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_always_eager=True,  # Runs tasks synchronously (bypasses Redis)
    task_store_eager_result=True
)

# Autodiscover tasks from the workers.tasks package
celery_app.autodiscover_tasks(["app.workers"])
