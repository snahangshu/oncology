from datetime import datetime
from sqlalchemy.orm import Session
from app.modules.infusion.schemas import ScheduleProposal, ProposedAssignment, OverrideRequest, OverrideResponse
from app.modules.infusion.models import InfusionSchedule
from app.modules.infusion.repository import InfusionRepository
from app.modules.scheduling.repository import AppointmentRepository
from app.modules.audit.repository import AuditRepository
from app.modules.ai.optimiser.schedule_optimiser import ScheduleOptimiser
from app.modules.ai.optimiser.conflict_explainer import ConflictExplainer

class InfusionService:
    def __init__(self, db: Session):
        self.db = db
        self.infusion_repo = InfusionRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.audit_repo = AuditRepository(db)

    def get_schedule_proposal(self, patient_id: int) -> ScheduleProposal:
        """
        Orchestrates the OR-Tools optimizer to generate a conflict-free chair and nurse
        assignment schedule proposal for a patient.
        """
        optimiser = ScheduleOptimiser()
        result = optimiser.optimise_schedule(patient_id)

        assignments = []
        for r in result.get("assignments", []):
            assignments.append(
                ProposedAssignment(
                    chair_id=r["chair_id"],
                    nurse_id=r["nurse_id"],
                    start_time=r["start_time"],
                    end_time=r["end_time"]
                )
            )

        return ScheduleProposal(
            patient_id=patient_id,
            proposal_id="prop_456",
            assignments=assignments,
            constraints_satisfied=result.get("success", True),
            creation_time=datetime.utcnow()
        )

    def apply_override(self, request: OverrideRequest) -> OverrideResponse:
        """
        Applies a manual schedule override.
        First validates if any hard clinical conflicts are triggered. If conflicts exist,
        uses AI conflict explainer to return details.
        """
        conflicts = self.infusion_repo.check_chair_conflicts(
            request.chair_id, request.start_time, request.end_time
        )

        if conflicts:
            explainer = ConflictExplainer()
            explanation = explainer.explain_conflict(
                conflict_details={
                    "chair_id": request.chair_id,
                    "requested_start": request.start_time.isoformat(),
                    "requested_end": request.end_time.isoformat(),
                    "overlapping_count": len(conflicts)
                },
                justification=request.justification
            )

            # Audit log override denial
            self.audit_repo.append_only_insert(
                action="override_failed_conflict",
                user_id="system",
                patient_id=request.patient_id,
                details={
                    "chair_id": request.chair_id,
                    "explanation": explanation
                }
            )

            return OverrideResponse(
                success=False,
                conflict_detected=True,
                conflict_description=explanation
            )

        appointments = self.appointment_repo.get_by_patient_id(request.patient_id)
        appointment_id = appointments[0].id if appointments else 1

        schedule = InfusionSchedule(
            patient_id=request.patient_id,
            appointment_id=appointment_id,
            status="confirmed_override"
        )
        self.infusion_repo.create(schedule)

        # Create assignments
        self.infusion_repo.create_chair_assignment(
            schedule.id, request.chair_id, request.start_time, request.end_time
        )
        self.infusion_repo.create_nurse_assignment(
            schedule.id, request.nurse_id, request.start_time, request.end_time
        )

        # Audit log successful override
        self.audit_repo.append_only_insert(
            action="override_applied",
            user_id="system",
            patient_id=request.patient_id,
            details={
                "schedule_id": schedule.id,
                "chair_id": request.chair_id,
                "nurse_id": request.nurse_id
            }
        )

        return OverrideResponse(
            success=True,
            conflict_detected=False,
            override_id=schedule.id
        )

