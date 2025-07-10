from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


# main table prototype
class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    content: Optional[str] = None
    
    confidentiality: Optional[str] = None
    department: Optional[str] = None
    client: Optional[str] = None

    pointer_to_loc: Optional[str] = None   # in case user asks for original file
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed: bool = Field(default=False)