import logging
from app.workers.celery_app import celery_app
from app.modules.ai.classifiers import DrugSafetyAgent, ToxicityAssessmentAgent

logger = logging.getLogger(__name__)

@celery_app.task(name="app.workers.tasks.safety_checks.run_drug_safety_check")
def run_drug_safety_check(patient_id: int, proposed_regimen: str, allergies: str, current_meds: str, renal_function: str, hepatic_function: str) -> dict:
    """
    Runs the drug safety AI agent against patient data.
    """
    agent = DrugSafetyAgent()
    res = agent.assess_safety(patient_id, proposed_regimen, allergies, current_meds, renal_function, hepatic_function)
    return res

@celery_app.task(name="app.workers.tasks.safety_checks.assess_infusion_toxicity")
def assess_infusion_toxicity(patient_id: int, clinical_note: str) -> dict:
    """
    Runs toxicity assessment (grading) against post-infusion notes.
    """
    agent = ToxicityAssessmentAgent()
    res = agent.grade_toxicities(patient_id, clinical_note)
    return res
