from fastapi import APIRouter
from app.modules.intake.router import router as intake_router, documents_router
from app.modules.scheduling.router import router as scheduling_router
from app.modules.infusion.router import router as infusion_router
from app.modules.audit.router import router as audit_router
from app.modules.doctors.router import router as doctors_router
from app.modules.users.router import router as users_router
from app.api.v1.dashboards import router as dashboards_router

from app.modules.intake.patients_router import router as patients_router

api_router = APIRouter()

api_router.include_router(patients_router, prefix="/patients", tags=["Patients"])
api_router.include_router(intake_router, prefix="/intake", tags=["Intake"])
api_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
api_router.include_router(scheduling_router, prefix="/slots", tags=["Scheduling"])
api_router.include_router(infusion_router, prefix="/infusion", tags=["Infusion"])
api_router.include_router(audit_router, prefix="/audit", tags=["Audit"])
api_router.include_router(doctors_router, prefix="/doctors", tags=["Doctors"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(dashboards_router, prefix="/dashboards", tags=["Dashboards"])
