import sys
import os
import time
import urllib.request
import urllib.parse
import urllib.error
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://127.0.0.1:8000/api/v1"
PATIENT_ID = 1

def run_tests():
    logger.info("Starting API Test Suite...")
    
    # 1. Test Scheduling Availability API (Standard & Worst Case)
    logger.info("--- Test 1: Scheduling API ---")
    start = time.time()
    try:
        req = urllib.request.Request(f"{BASE_URL}/slots?appointment_type=NEW_CONSULT&patient_id=1&specialty=Medical%20Oncology", headers={"User-Agent": "Test"})
        res = urllib.request.urlopen(req, timeout=10)
        data = res.read()
        dur = time.time() - start
        if res.getcode() == 200:
            logger.info(f"✅ Scheduling API passed in {dur:.2f}s. Options found: {len(json.loads(data))}")
        else:
            logger.error(f"❌ Scheduling API failed: {res.getcode()} {data}")
    except urllib.error.HTTPError as e:
        logger.error(f"❌ Scheduling API failed: {e.code} {e.read().decode()}")
    except Exception as e:
        logger.error(f"❌ Scheduling API Exception: {e}")

    # 2. Test AI Generate Brief (Standard)
    logger.info("\n--- Test 2: AI Generate Brief (Standard) ---")
    payload = {
        "patient_name": "Test Patient",
        "diagnosis": "Breast Cancer Stage II",
        "clinical_history": "Patient diagnosed in 2024. Undergoing chemo.",
        "recent_labs": "Normal CBC",
        "imaging_reports": "Normal MRI"
    }
    start = time.time()
    try:
        req = urllib.request.Request(f"{BASE_URL}/doctors/{PATIENT_ID}/generate-brief", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", "User-Agent": "Test"})
        res = urllib.request.urlopen(req, timeout=30)
        data = res.read()
        dur = time.time() - start
        if res.getcode() == 200:
            logger.info(f"✅ AI Summarization (Standard) passed in {dur:.2f}s.")
        else:
            logger.error(f"❌ AI Summarization failed: {res.getcode()} {data}")
    except urllib.error.HTTPError as e:
        logger.error(f"❌ AI Summarization failed: {e.code} {e.read().decode()}")
    except Exception as e:
        logger.error(f"❌ AI Summarization Exception: {e}")

    # 3. Test AI Generate Brief (Worst Case - Massive Payload)
    logger.info("\n--- Test 3: AI Generate Brief (Massive Payload) ---")
    massive_history = "This is a repeated history entry. " * 5000  # ~35,000 words
    payload["clinical_history"] = massive_history
    start = time.time()
    try:
        req = urllib.request.Request(f"{BASE_URL}/doctors/{PATIENT_ID}/generate-brief", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", "User-Agent": "Test"})
        res = urllib.request.urlopen(req, timeout=60)
        data = res.read()
        dur = time.time() - start
        if res.getcode() == 200:
            logger.info(f"✅ AI Summarization (Massive) passed in {dur:.2f}s.")
        else:
            logger.error(f"❌ AI Summarization (Massive) failed: {res.getcode()} {data}")
    except urllib.error.HTTPError as e:
        logger.error(f"❌ AI Summarization (Massive) failed: {e.code} {e.read().decode()}")
    except Exception as e:
        logger.error(f"❌ AI Summarization (Massive) Exception: {e}")

    # 4. Test AI Pathology Triage Accuracy (Direct AI Agent invocation)
    logger.info("\n--- Test 4: Document Triage Agent (Garbage Data) ---")
    # We load the django environment to test the agent directly
    sys.path.append(os.getcwd())
    try:
        from app.modules.ai.classifiers.pathology import PathologyTriageAgent
        agent = PathologyTriageAgent()
        garbage_text = "Here is a recipe for chocolate chip cookies. You need flour, sugar, and chocolate."
        start = time.time()
        res = agent.extract_tumor_details(999, garbage_text)
        dur = time.time() - start
        logger.info(f"✅ AI Triage (Garbage Data) completed in {dur:.2f}s. Result: {res}")
        if "Unknown" in res.get("cancer_type", ""):
            logger.info("   -> Agent correctly handled non-medical data without hallucinating.")
        else:
            logger.warning("   -> Agent hallucinated medical data from a recipe!")
    except ImportError as e:
        logger.error(f"❌ Could not import agent: {e}")
    except Exception as e:
        logger.error(f"❌ AI Triage Exception: {e}")
        
    logger.info("\nTest Suite Completed.")

if __name__ == "__main__":
    run_tests()
