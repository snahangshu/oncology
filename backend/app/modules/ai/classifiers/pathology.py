import json
import logging

logger = logging.getLogger(__name__)

class PathologyTriageAgent:
    """
    Simulates an LLM agent that extracts clinical parameters from an uploaded Pathology Report.
    In a production system, this would make an API call to OpenAI/Anthropic.
    """
    def extract_tumor_details(self, document_id: int, text: str) -> dict:
        text_lower = text.lower()
        
        # Default fallback
        result = {
            "cancer_type": "Unknown Tumor Type",
            "stage": "Unknown",
            "urgency_level": "ROUTINE"
        }
        
        # Dummy keyword-based extraction to mock LLM behavior
        if "breast" in text_lower:
            result["cancer_type"] = "Breast Cancer"
            if "triple negative" in text_lower or "grade 3" in text_lower or "stage iii" in text_lower or "stage 3" in text_lower:
                result["stage"] = "III"
                result["urgency_level"] = "URGENT"
            else:
                result["stage"] = "I"
                result["urgency_level"] = "ROUTINE"
                
        elif "leukemia" in text_lower or "aml" in text_lower:
            result["cancer_type"] = "Acute Myeloid Leukemia"
            result["stage"] = "N/A"
            result["urgency_level"] = "CRITICAL"
            
        elif "lung" in text_lower or "thoracic" in text_lower:
            result["cancer_type"] = "Lung Cancer"
            if "metastatic" in text_lower or "stage iv" in text_lower or "stage 4" in text_lower:
                result["stage"] = "IV"
                result["urgency_level"] = "CRITICAL"
            else:
                result["stage"] = "II"
                result["urgency_level"] = "URGENT"

        # Note: We are simulating a high-quality JSON response from an LLM
        logger.info(f"[AI Parsing] Extracted tumor details for Doc {document_id}: {result}")
        return result
