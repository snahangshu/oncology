import logging
from app.workers.celery_app import celery_app
from app.modules.ai.classifiers import PreConsultBriefAgent, TreatmentPlanStructurer

logger = logging.getLogger(__name__)

@celery_app.task(name="app.workers.tasks.clinical_analysis.generate_pre_consult_brief")
def generate_pre_consult_brief(patient_id: int, patient_name: str, diagnosis: str, clinical_history: str, recent_labs: str, imaging_reports: str) -> dict:
    """
    Generates a pre-consultation brief and returns the structured data.
    """
    agent = PreConsultBriefAgent()
    res = agent.generate_brief(patient_id, patient_name, diagnosis, clinical_history, recent_labs, imaging_reports)
    return res

@celery_app.task(name="app.workers.tasks.clinical_analysis.structure_treatment_plan")
def structure_treatment_plan(patient_id: int, clinical_note: str) -> dict:
    """
    Translates an oncologist's decision note into a structured treatment plan.
    """
    agent = TreatmentPlanStructurer()
    res = agent.structure_plan(patient_id, clinical_note)
    return res
