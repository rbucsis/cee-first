from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    birthdate: Optional[date] = None
    enroll_date: date = Field(default_factory=date.today)


class StudentUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    birthdate: Optional[date] = None
    enroll_date: Optional[date] = None


class StudentResponse(BaseModel):
    id: UUID
    center_id: UUID
    first_name: str
    last_name: Optional[str] = None
    birthdate: Optional[date] = None
    enroll_date: date
    created_utc: datetime
    updated_utc: datetime
    record_status: str