import asyncio
import httpx

API_URL = "http://localhost:8000/api/v1"
PATIENT_ID = 999

async def run_tests():
    print("--- Testing AI Agent Endpoints ---")
    
    async with httpx.AsyncClient(base_url=API_URL, timeout=10.0) as client:
        # 1. Test Generate Brief (Doctors API)
        print(f"\n1. Testing /doctors/{PATIENT_ID}/generate-brief ...")
        res = await client.post(
            f"/doctors/{PATIENT_ID}/generate-brief",
            json={
                "patient_name": "Jane Doe",
                "diagnosis": "Stage II Breast Cancer",
                "clinical_history": "Previous lumpectomy in 2024.",
                "recent_labs": "WBC 4.5, Plt 150k",
                "imaging_reports": "Clear margins, no lymph node involvement."
            }
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
        
        # 2. Test Structure Plan (Doctors API)
        print(f"\n2. Testing /doctors/{PATIENT_ID}/structure-plan ...")
        res = await client.post(
            f"/doctors/{PATIENT_ID}/structure-plan",
            json={
                "clinical_note": "Start AC-T regimen for 4 cycles."
            }
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
        
        # 3. Test Drug Safety (Infusion API)
        print(f"\n3. Testing /infusion/{PATIENT_ID}/safety-check ...")
        res = await client.post(
            f"/infusion/{PATIENT_ID}/safety-check",
            json={
                "proposed_regimen": "Doxorubicin 60 mg/m2",
                "allergies": "None",
                "current_meds": "Lisinopril",
                "renal_function": "CrCl > 60",
                "hepatic_function": "Normal AST/ALT"
            }
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")

        print("\nAll API tests fired successfully! Background jobs should now be running in Celery.")

if __name__ == "__main__":
    asyncio.run(run_tests())
