from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    VECTORIZING = "vectorizing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    content: Optional[str] = None
    
    confidentiality: Optional[str] = None
    department: Optional[str] = None
    client: Optional[str] = None

    pointer_to_loc: Optional[str] = None   # in case user asks for original file
    file_size: Optional[int] = None  # file size in bytes
    created_at: datetime = Field(default_factory=datetime.utcnow) 
    processed: bool = Field(default=False)


class ChatSession(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    llm_model: str
    user_id: Optional[str] = None  
    status: Optional[str] = None   # e.g. 'active', 'archived', 'finished'
    session_metadata: Optional[str] = None # e.g. JSON string with additional information


class ChatMessage(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chatsession.id")
    role: str  # e.g. 'user', 'assistant', 'system', etc.
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sources: Optional[str] = None  # e.g. JSON string with list of sources
    confidence: Optional[float] = None
    hallucination: Optional[float] = None


class FileProcessingTask(SQLModel, table=True):
    """Track file processing progress and status"""
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    document_id: int = Field(foreign_key="document.id")
    status: ProcessingStatus = Field(default=ProcessingStatus.PENDING)
    current_step: Optional[str] = None
    progress_percentage: float = Field(default=0.0)
    error_message: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    upload_progress: float = Field(default=0.0)
    extraction_progress: float = Field(default=0.0)
    chunking_progress: float = Field(default=0.0)
    vectorization_progress: float = Field(default=0.0)


class TypingIndicator(SQLModel, table=True):
    """Track typing indicators for real-time chat"""
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="chatsession.id")
    user_id: Optional[str] = None
    is_typing: bool = Field(default=False)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


