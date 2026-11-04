from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

class FileRename(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=100)

class FileResponse(BaseModel):
    id: UUID
    center_id: UUID
    ref_table: Optional[str] = None
    ref_id: Optional[UUID] = None
    file_name: str
    file_type: str
    created_utc: datetime
    updated_utc: datetime
    record_status: str