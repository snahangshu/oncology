from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any

class InsuranceDetailsSchema(BaseModel):
    provider_name: str = Field(..., description="Name of the insurance provider")
    policy_number: str = Field(..., description="Insurance policy number")
    group_number: Optional[str] = Field(None, description="Optional group number")

class IntakeFormRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    date_of_birth: str = Field(..., description="Format: YYYY-MM-DD")
    email: EmailStr
    phone: str
    primary_diagnosis: Optional[str] = Field(None, description="Primary clinical diagnosis if known")
    patient_comments: Optional[str] = Field(None, description="Patient's condition description/comments")
    insurance_details: InsuranceDetailsSchema

class PatientRegistrationRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    date_of_birth: str = Field(..., description="Format: YYYY-MM-DD")
    gender: Optional[str] = Field(None, description="Patient gender")
    email: EmailStr
    phone: str
    address: Optional[str] = Field(None, description="Patient address")
    insurance_details: InsuranceDetailsSchema

class PatientRegistrationResponse(BaseModel):
    patient_id: int
    message: str

class OncologyIntakeSchema(BaseModel):
    id: int
    patient_id: int
    referral_letter: Optional[Dict[str, Any]] = None
    pathology_report: Optional[Dict[str, Any]] = None
    imaging_report: Optional[Dict[str, Any]] = None
    insurance_authorization: Optional[Dict[str, Any]] = None
    intake_status: str
    completion_percentage: int

    class Config:
        from_attributes = True

class IntakeFormResponse(BaseModel):
    patient_id: int
    status: str = Field("received", description="Status of the intake form processing")
    urgency_level: Optional[str] = Field(None, description="Classified clinical urgency level")
    completeness_checked: bool = Field(False)

class DocumentUploadRequest(BaseModel):
    patient_id: int
    document_type: str = Field(..., description="E.g., Pathology Report, Referral Letter")

class DocumentUploadResponse(BaseModel):
    document_id: int
    status: str
    task_id: str

class CompletenessResult(BaseModel):
    document_id: int
    is_complete: bool
    missing_sections: List[str] = Field(default_factory=list)
    extracted_metadata: Dict[str, Any] = Field(default_factory=dict)

from enum import Enum

class UrgencyLevel(str, Enum):
    ROUTINE = "ROUTINE"
    URGENT = "URGENT"
    EMERGENT = "EMERGENT"

class UrgencyClassificationRequest(BaseModel):
    patient_id: int
    clinical_notes: str

class UrgencyClassificationResponse(BaseModel):
    patient_id: int
    urgency_level: UrgencyLevel
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    reasoning: Optional[str] = None

class TreatmentPlanResponse(BaseModel):
    id: int
    patient_id: int
    regimen_name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str
    cycles: Optional[int] = None
    current_cycle: Optional[int] = None

    class Config:
        from_attributes = True

class LabResultResponse(BaseModel):
    id: int
    patient_id: int
    test_name: str
    result_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str
    date_collected: Optional[str] = None

    class Config:
        from_attributes = True

