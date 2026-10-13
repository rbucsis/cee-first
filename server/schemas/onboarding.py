from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class OnboardRequest(BaseModel):
    # User Credentials & Profile
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: Optional[str] = Field(None, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    
    # Organization / Primary Center Details
    center_name: str = Field(..., min_length=2, max_length=255)
    address_1: str = Field(..., min_length=2, max_length=255)
    address_2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    province: str = Field("SK", min_length=2, max_length=2)
    postal_code: str = Field(..., min_length=6, max_length=10)
    phone: Optional[str] = Field(None, max_length=20)