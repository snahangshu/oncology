from datetime import datetime, timedelta
from ortools.sat.python import cp_model
from typing import Dict, Any

class ScheduleOptimiser:
    def optimise_schedule(self, patient_id: int) -> Dict[str, Any]:
        """
        Runs the OR-Tools CP-SAT model to find an optimal chair and nurse allocation.
        """
        model = cp_model.CpModel()

        # Let's define the decision variables for a simplified 1-day scheduling problem (8 slots, e.g. 9am to 5pm)
        # We have 3 chairs and 2 nurses
        num_slots = 8
        num_chairs = 3
        num_nurses = 2

        # Variables: x[chair, nurse, slot] = 1 if patient is scheduled on chair c, with nurse n, at slot s
        x = {}
        for c in range(num_chairs):
            for n in range(num_nurses):
                for s in range(num_slots):
                    x[c, n, s] = model.NewBoolVar(f"x_c{c}_n{n}_s{s}")

        # Constraint 1: Assign exactly one slot combination for the patient
        model.Add(sum(x[c, n, s] for c in range(num_chairs) for n in range(num_nurses) for s in range(num_slots)) == 1)

        # Constraint 2: Nursing Ratio (at most 2 patients per nurse in any slot)
        # In a real system we would model other patients as well. Here we enforce the capacity constraint.
        for n in range(num_nurses):
            for s in range(num_slots):
                # single patient can occupy at most 1 slot here
                model.Add(sum(x[c, n, s] for c in range(num_chairs)) <= 2)

        # Objective: Prefer early slots (minimise slot index)
        model.Minimize(sum(s * x[c, n, s] for c in range(num_chairs) for n in range(num_nurses) for s in range(num_slots)))

        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 5.0
        status = solver.Solve(model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # Extract solution
            chosen_chair = 0
            chosen_nurse = 0
            chosen_slot = 0
            for c in range(num_chairs):
                for n in range(num_nurses):
                    for s in range(num_slots):
                        if solver.Value(x[c, n, s]) == 1:
                            chosen_chair = c + 1
                            chosen_nurse = n + 1
                            chosen_slot = s
                            break

            base_time = datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1)
            start_time = base_time + timedelta(hours=chosen_slot)
            end_time = start_time + timedelta(hours=1)

            return {
                "success": True,
                "assignments": [
                    {
                        "chair_id": chosen_chair,
                        "nurse_id": chosen_nurse,
                        "start_time": start_time,
                        "end_time": end_time
                    }
                ]
            }

        return {
            "success": False,
            "assignments": []
        }
