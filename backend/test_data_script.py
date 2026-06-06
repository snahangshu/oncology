import sys
import os
from datetime import datetime, date, time, timedelta

# Ensure the app can import modules properly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy.orm import Session
from app.dependencies import SessionLocal
from app.modules.intake.models import Patient, OncologyIntake, TreatmentPlan, TreatmentCycle
from app.modules.scheduling.models import Appointment
from app.modules.doctors.models import Doctor

def create_demo_patient():
    db: Session = SessionLocal()
    try:
        # Get any active doctor
        doctor = db.query(Doctor).filter(Doctor.status == "active").first()
        if not doctor:
            print("No active doctor found!")
            return

        print("Creating demo patient...")
        patient = Patient(
            first_name="Jane",
            last_name="Doe (Demo)",
            date_of_birth=date(1980, 5, 15),
            gender="Female",
            phone="555-0199",
            email="jane.doe.demo4@example.com",
            address="123 Demo St, Cityville",
            urgency_level="URGENT",
            primary_diagnosis="Stage IIA Invasive Ductal Carcinoma of the left breast. ER/PR positive, HER2 negative.",
            patient_comments="Patient reports new lump discovered 3 weeks ago."
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        print(f"Created Patient ID: {patient.id}")

        print("Creating Oncology Intake...")
        intake = OncologyIntake(
            patient_id=patient.id,
            referral_letter="Patient referred for surgical and oncological evaluation of breast mass.",
            pathology_report="Core biopsy shows ER+ PR+ HER2- invasive ductal carcinoma. Grade 2.",
            imaging_report="Mammogram and Ultrasound reveal 2.5cm mass in left upper outer quadrant. No suspicious axillary lymph nodes.",
            ai_summary="AI Summary: 44yo female presenting with newly diagnosed Stage IIA ER/PR+, HER2- breast cancer. Recommended for surgical consultation and possible neoadjuvant/adjuvant chemotherapy."
        )
        db.add(intake)
        db.commit()
        
        print("Booking Appointment for today...")
        today_start = datetime.combine(date.today(), time(14, 0)) # 2:00 PM today
        appt = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            start_time=today_start,
            end_time=today_start + timedelta(minutes=30),
            status="Scheduled",
            specialty="Oncology"
        )
        db.add(appt)
        db.commit()
        db.refresh(appt)
        print(f"Created Appointment ID: {appt.id}")

        print("Simulating Doctor 'Approve & Submit'...")
        # Mark appt completed
        appt.status = "Completed"
        appt.prescription_notes = "Approved Dose-Dense AC-T regimen."
        
        # Generate Plan
        plan = TreatmentPlan(
            patient_id=patient.id,
            appointment_id=appt.id,
            regimen_name="Dose-Dense AC-T (Doxorubicin + Cyclophosphamide followed by Paclitaxel)",
            description="4 cycles of AC every 2 weeks followed by 4 cycles of Paclitaxel every 2 weeks. Total 8 cycles. Curative intent.",
            cycles=8,
            status="Active"
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
        print(f"Created Treatment Plan ID: {plan.id}")

        print("Generating Treatment Cycles...")
        for i in range(1, plan.cycles + 1):
            cycle = TreatmentCycle(
                treatment_plan_id=plan.id,
                cycle_number=i,
                status="PLANNED",
                labs_uploaded=False,
                ai_fit_check_passed=False,
                pharmacy_vials_approved=False,
                ready_for_booking=False
            )
            db.add(cycle)
        db.commit()
        
        print("✅ Demo setup complete! You can now log into the Patient Portal to view this plan and upload labs.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_patient()
