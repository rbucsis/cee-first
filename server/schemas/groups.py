from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class GroupResponse(BaseModel):
    id: UUID
    center_id: UUID
    name: str
    created_utc: datetime
    updated_utc: datetime
    record_status: str