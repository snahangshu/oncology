import json
import logging

logger = logging.getLogger(__name__)

class PathologyTriageAgent:
    """
    Simulates an LLM agent that extracts clinical parameters from an uploaded Pathology Report.
    In a production system, this would make an API call to OpenAI/Anthropic.
    """
    def extract_tumor_details(self, document_id: int, text: str) -> dict:
        from app.modules.ai.client import AIClientManager
        import json
        import re
        
        system_prompt = """
        You are an expert oncology clinical data extractor.
        Extract the cancer type, stage, and triage urgency level from the provided pathology report.
        Return ONLY valid JSON in this exact format:
        {
            "cancer_type": "string (e.g. Abdominal Cancer, Breast Cancer, Unknown)",
            "stage": "string (e.g. I, II, III, IV, N/A, Unknown)",
            "urgency_level": "string (strictly one of: ROUTINE, URGENT, CRITICAL)"
        }
        Do not include markdown blocks or any other text.
        """
        
        messages = [
            {"role": "user", "content": f"Pathology report text:\n{text[:5000]}"}
        ]
        
        try:
            client = AIClientManager()
            response_text = client.invoke_with_retry(
                system=system_prompt,
                messages=messages,
                temperature=0.0
            )
            
            # Basic cleanup if the model included markdown ticks
            json_str = response_text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
                
            result = json.loads(json_str.strip())
            
            # Ensure required keys exist
            return {
                "cancer_type": result.get("cancer_type", "Unknown Tumor Type"),
                "stage": result.get("stage", "Unknown"),
                "urgency_level": result.get("urgency_level", "ROUTINE").upper()
            }
        except Exception as e:
            logger.error(f"[AI Parsing] Failed to extract tumor details for Doc {document_id}: {e}")
            return {
                "cancer_type": "Unknown Tumor Type (Error)",
                "stage": "Unknown",
                "urgency_level": "ROUTINE"
            }
