from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class StudentContactLinkCreate(BaseModel):
    student_id: UUID
    contact_id: UUID
    primary_contact: bool = False
    emergency_contact: bool = False
    relation: Optional[str] = Field(None, max_length=100)
    user_id: Optional[UUID] = None


class StudentContactLinkUpdate(BaseModel):
    primary_contact: Optional[bool] = None
    emergency_contact: Optional[bool] = None
    relation: Optional[str] = Field(None, max_length=100)
    user_id: Optional[UUID] = None


class StudentContactLinkResponse(BaseModel):
    id: UUID
    student_id: UUID
    contact_id: UUID
    primary_contact: bool
    emergency_contact: bool
    relation: Optional[str] = None
    user_id: Optional[UUID] = None
    created_utc: datetime
    updated_utc: datetime
    record_status: str

    # Embedded joined details for direct UI rendering
    student_first_name: Optional[str] = None
    student_last_name: Optional[str] = None
    contact_first_name: Optional[str] = None
    contact_last_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None