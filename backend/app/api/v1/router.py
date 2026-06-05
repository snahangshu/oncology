from fastapi import APIRouter
from app.modules.intake.router import router as intake_router, documents_router
from app.modules.scheduling.router import router as scheduling_router
from app.modules.infusion.router import router as infusion_router
from app.modules.audit.router import router as audit_router
from app.modules.doctors.router import router as doctors_router
from app.modules.users.router import router as users_router
from app.modules.users.staff_router import router as staff_router
from app.api.v1.dashboards import router as dashboards_router

from app.modules.intake.patients_router import router as patients_router
from app.modules.intake.treatment_router import router as treatment_router

from app.modules.ai.voice_router import router as voice_router
from app.modules.infusion.journey_router import router as journey_router

api_router = APIRouter()

api_router.include_router(patients_router, prefix="/patients", tags=["Patients"])
api_router.include_router(intake_router, prefix="/intake", tags=["Intake"])
api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
api_router.include_router(scheduling_router, prefix="/slots", tags=["Scheduling"])
api_router.include_router(infusion_router, prefix="/infusion", tags=["Infusion"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit"])
api_router.include_router(doctors_router, prefix="/doctors", tags=["Doctors"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(staff_router, prefix="/staff", tags=["Staff"])
api_router.include_router(voice_router, prefix="/ai", tags=["ai"])
api_router.include_router(journey_router, prefix="/journey", tags=["infusion", "journey"])
api_router.include_router(dashboards_router, prefix="/dashboards", tags=["Dashboards"])
api_router.include_router(treatment_router, prefix="/treatment-plans", tags=["Treatment Plans"])
