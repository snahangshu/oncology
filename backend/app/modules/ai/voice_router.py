from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from omnidimension import Client
from app.config import settings

router = APIRouter()

class VoiceWidgetResponse(BaseModel):
    iframe_url: str

_agent_id = None

@router.get("/voice-widget", response_model=VoiceWidgetResponse)
def get_voice_widget():
    """Create or get the Omnidimension voice agent web widget configuration."""
    if not settings.OMNIDIMENSION_API_KEY:
        raise HTTPException(status_code=500, detail="OMNIDIMENSION_API_KEY is not configured")
        
    try:
        client = Client(settings.OMNIDIMENSION_API_KEY)
        global _agent_id
        
        if not _agent_id:
            # Find existing agent by name to avoid duplicates if possible, else create
            agents = client.agent.list().get("json", {}).get("data", [])
            for a in agents:
                if a.get("name") == "Dora Healthcare Voice Assistant - Web":
                    _agent_id = a.get("id")
                    break
                    
            if not _agent_id:
                response = client.agent.create(
                    name="Dora Healthcare Voice Assistant - Web",
                    welcome_message="Hello, this is Meenakshi calling from ILS Hospital. Could you please verify your patient details first?",
                    context_breakdown=[
                        {"title": "Patient Verification", "body": "Ask for the patient's ID, Name, and Date of Birth before proceeding.", "is_enabled": True}
                    ],
                    call_type="WebCall",
                    transcriber={"provider": "Azure", "silence_timeout_ms": 400},
                    model={"model": "gpt-4o-mini", "temperature": 0.7},
                    voice={"provider": "cartesia", "voice_id": "12d06b03-64cf-46f5-840f-5b0c4cc277e3"},
                    languages=["English (American)"],
                    interruption={"enabled": True, "min_words": 3},
                    noise_reduction=True,
                    call_ending={
                        "max_duration_sec": 600,
                        "enabled": True,
                        "condition": "End the call when the user says goodbye",
                        "message": "Thank you for calling. Have a great day!"
                    },
                    user_idle={
                        "threshold_sec": 10,
                        "last_message": "I'll leave you for now. Have a nice day!"
                    }
                )
                _agent_id = response.get("json", {}).get("id")
            
        if not _agent_id:
            raise HTTPException(status_code=500, detail="Failed to initialize voice agent")
            
        agent_data = client.agent.get(_agent_id)
        widget_config = agent_data.get("json", {}).get("widget_config", {})
        
        iframe_url = widget_config.get("iframeUrl")
        
        if not iframe_url:
            raise HTTPException(status_code=500, detail="Failed to get iframe URL from agent configuration")
            
        return {"iframe_url": iframe_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice Assistant Error: {str(e)}")
