from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

class TeamMemberCreate(BaseModel):
    first_name: Optional[str] = Field(..., min_length=1, max_length=100)
    last_name: Optional[str] = Field(..., min_length=1, max_length=100)
    email: str
    user_role: str

class TeamMemberUpdate(BaseModel):
    user_role: str

class TeamMemberResponse(BaseModel):
    id: UUID
    center_id: UUID
    first_name: str
    last_name: Optional[str] = None
    email: str
    ece_level: str
    user_role: str
    created_utc: datetime
    updated_utc: datetime
    record_status: str