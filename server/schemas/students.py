from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    birthdate: Optional[date] = None
    enroll_date: date = Field(default_factory=date.today)
    group_id: Optional[UUID] = None
    diet_notes: Optional[str] = Field(None, max_length=500)
    medical_notes: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=500)
    


class StudentUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    birthdate: Optional[date] = None
    enroll_date: Optional[date] = None
    group_id: Optional[UUID] = None
    diet_notes: Optional[str] = Field(None, max_length=500)
    medical_notes: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=500)


class StudentResponse(BaseModel):
    id: UUID
    center_id: UUID
    first_name: str
    last_name: Optional[str] = None
    birthdate: Optional[date] = None
    enroll_date: date
    group_id: Optional[UUID] = None
    diet_notes: Optional[str] = None
    medical_notes: Optional[str] = None
    notes: Optional[str] = None
    created_utc: datetime
    updated_utc: datetime
    record_status: str