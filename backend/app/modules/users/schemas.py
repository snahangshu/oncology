from pydantic import BaseModel, EmailStr
from app.modules.users.models import Role

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Role

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    verification_status: str | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    email: str | None = None
