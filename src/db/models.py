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


class ChatSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    llm_model: str
    user_id: Optional[str] = None  
    status: Optional[str] = None   # e.g. 'active', 'archived', 'finished'
    session_metadata: Optional[str] = None # e.g. JSON string with additional information

class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chatsession.id")
    role: str  # e.g. 'user', 'assistant', 'system', etc.
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sources: Optional[str] = None  # e.g. JSON string with list of sources
    confidence: Optional[float] = None
    hallucination: Optional[float] = None


