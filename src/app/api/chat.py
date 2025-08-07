from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, AsyncGenerator
import sys
import asyncio
from pathlib import Path
from src.db.database import get_session
from src.db.models import ChatSession, ChatMessage
from sqlmodel import select
from sqlalchemy import func
from sqlmodel import delete
import os
import openai
import json
from datetime import datetime

# Add the src directory to Python path
src_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(src_path))

from vectorstore.qdrant_search import search_documents
from vectorstore.qdrant_indexer import index_chunks
from file_ingestion.preprocessor import preprocess_document_to_chunks
import requests
import json
from chat_logic.message_handler import handle_chat_message

router = APIRouter()

LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:11434/api/generate")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", Path(__file__).parent.parent.parent.parent / "upload_files"))
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "mistral")

# Request Models
class CreateChatSessionRequest(BaseModel):
    """Request model for creating a new chat session"""
    title: str = Field(..., description="Title of the chat session")
    llm_model: Optional[str] = Field(None, description="LLM model to use (default: mistral)")
    user_id: Optional[str] = Field(None, description="User ID associated with the session")
    status: Optional[str] = Field(None, description="Status of the session (e.g., 'active', 'archived')")
    session_metadata: Optional[str] = Field(None, description="Additional metadata for the session")

class ChatRequest(BaseModel):
    """Request model for sending a chat message"""
    question: str = Field(..., description="The question to ask")
    model: Optional[str] = Field(None, description="LLM model to use (default: mistral)")
    selected_document_ids: Optional[List[int]] = Field(None, description="List of document IDs to focus on")
    search_mode: Optional[str] = Field("all", description="Search mode to use: 'all', 'hybrid', 'selected_only'")

class UpdateChatSessionRequest(BaseModel):
    """Request model for updating an existing chat session"""
    title: Optional[str] = Field(None, description="New title for the chat session")
    llm_model: Optional[str] = Field(None, description="New LLM model for the session")
    status: Optional[str] = Field(None, description="New status for the session (e.g., 'active', 'archived', 'finished')")
    session_metadata: Optional[str] = Field(None, description="New metadata for the session")

# Response Models
class ChatSessionResponse(BaseModel):
    """Response model for chat session data"""
    id: int
    title: str
    created_at: Optional[str]
    llm_model: str
    user_id: Optional[str]
    status: Optional[str]
    session_metadata: Optional[str]

class ChatMessageResponse(BaseModel):
    """Response model for chat message data"""
    id: int
    role: str
    content: str
    timestamp: Optional[str]
    sources: Optional[str]
    confidence: Optional[float]
    hallucination: Optional[float]

class MatchedChunkResponse(BaseModel):
    """Response model for matched document chunks"""
    text: str
    score: float
    metadata: Dict[str, Any]

class SimpleChatResponse(BaseModel):
    """Response model for simple chat endpoint"""
    question: str
    answer: str
    matched_chunks: List[MatchedChunkResponse]
    total_chunks_found: int

class SessionChatResponse(BaseModel):
    """Response model for session-based chat endpoint"""
    answer: str
    model: str
    sources: List[Dict[str, Any]]
    confidence: Optional[float]
    hallucination: Optional[float]

class ChatSessionsListResponse(BaseModel):
    """Response model for listing chat sessions"""
    message: str
    total_sessions: int
    sessions: List[ChatSessionResponse]

class ChatMessagesListResponse(BaseModel):
    """Response model for listing chat messages"""
    message: str
    total_messages: int
    messages: List[ChatMessageResponse]

class DeleteResponse(BaseModel):
    """Response model for delete operations"""
    message: str
    session_id: int


# Enhanced response models for better error handling
class ErrorDetail(BaseModel):
    """Detailed error information"""
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str


class EnhancedResponse(BaseModel):
    """Enhanced response wrapper with success/error handling"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[ErrorDetail] = None
    metadata: Optional[Dict[str, Any]] = None


@router.post("/{session_id}/message", response_model=SessionChatResponse)
async def chat_message_with_metadata(session_id: int, request: ChatRequest):
    """
    Send a chat message within a specific session with metadata tracking.
    
    Processes a question within a chat session and returns an answer with metadata 
    (sources, confidence, hallucination detection). Messages are stored in the database.
    """
    try:
        model = request.model
        if not model or model == "string":
            with get_session() as session:
                chat_session = session.exec(select(ChatSession).where(ChatSession.id == session_id)).first()
                if chat_session and chat_session.llm_model:
                    model = chat_session.llm_model
                else:
                    model = "mistral"
        result = handle_chat_message(
            session_id,
            request.question,
            model=model,
            selected_document_ids=request.selected_document_ids,
            search_mode=request.search_mode
            )
        return SessionChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error handling chat message: {str(e)}")


@router.post("/{session_id}/stream")
async def stream_chat_message(session_id: int, request: ChatRequest):
    """
    Stream a chat message response using Server-Sent Events (SSE).
    
    Provides real-time streaming of AI responses similar to ChatGPT.
    Returns chunks of the response as they are generated.
    """
    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            # Import streaming handler
            from chat_logic.message_handler import handle_chat_message_stream
            
            # Get model
            model = request.model
            if not model or model == "string":
                with get_session() as session:
                    chat_session = session.exec(select(ChatSession).where(ChatSession.id == session_id)).first()
                    if chat_session and chat_session.llm_model:
                        model = chat_session.llm_model
                    else:
                        model = "mistral"
            
            # Send initial metadata
            yield f"data: {json.dumps({'type': 'start', 'session_id': session_id, 'model': model})}\n\n"
            
            # Stream the response
            full_response = ""
            async for chunk_data in handle_chat_message_stream(
                session_id,
                request.question,
                model=model,
                selected_document_ids=request.selected_document_ids,
                search_mode=request.search_mode
            ):
                if chunk_data["type"] == "chunk":
                    full_response += chunk_data["content"]
                
                # Send chunk as SSE
                yield f"data: {json.dumps(chunk_data)}\n\n"
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            # Send error message
            error_data = {
                "type": "error",
                "error": str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable buffering
        }
    )


@router.get("/chat_sessions", response_model=ChatSessionsListResponse)
async def list_chat_sessions():
    """
    List all chat sessions with metadata from database.
    
    Returns a list of all chat sessions with their metadata and status.
    """
    try:
        with get_session() as session:
            statement = select(ChatSession)
            sessions = session.exec(statement).all()
            sessions_list = []
            for session_obj in sessions:
                sessions_list.append(ChatSessionResponse(
                    id=session_obj.id,
                    title=session_obj.title,
                    created_at=session_obj.created_at.isoformat() if session_obj.created_at else None,
                    llm_model=session_obj.llm_model,
                    user_id=session_obj.user_id,
                    status=session_obj.status,
                    session_metadata=session_obj.session_metadata
                ))
            return ChatSessionsListResponse(
                message="Chat sessions retrieved successfully",
                total_sessions=len(sessions_list),
                sessions=sessions_list
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat sessions: {str(e)}")

@router.get("/chat_sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: int):
    """
    Get specific chat session metadata by ID.
    
    Returns detailed information about a specific chat session.
    """
    try:
        with get_session() as session:
            chat_session = session.get(ChatSession, session_id)
            if not chat_session:
                raise HTTPException(status_code=404, detail="Chat session not found")
            return ChatSessionResponse(
                id=chat_session.id,
                title=chat_session.title,
                created_at=chat_session.created_at.isoformat() if chat_session.created_at else None,
                llm_model=chat_session.llm_model,
                user_id=chat_session.user_id,
                status=chat_session.status,
                session_metadata=chat_session.session_metadata
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat session: {str(e)}")

@router.delete("/chat_sessions/{session_id}", response_model=DeleteResponse)
async def delete_chat_session(session_id: int):
    """
    Delete a chat session by ID (and its messages).
    
    Removes the chat session and all associated messages from the database.
    """
    try:
        with get_session() as session:
            chat_session = session.get(ChatSession, session_id)
            if not chat_session:
                raise HTTPException(status_code=404, detail="Chat session not found")
            # Delete all messages for this session
            session.exec(delete(ChatMessage).where(ChatMessage.session_id == session_id))
            session.delete(chat_session)
            session.commit()
            return DeleteResponse(
                message="Chat session and its messages deleted successfully",
                session_id=session_id
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat session: {str(e)}")

@router.put("/chat_sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(session_id: int, request: UpdateChatSessionRequest):
    """
    Update an existing chat session by ID.
    
    Updates session fields like title, model, status, or metadata. Only provided fields will be updated.
    """
    try:
        with get_session() as session:
            chat_session = session.get(ChatSession, session_id)
            if not chat_session:
                raise HTTPException(status_code=404, detail="Chat session not found")
            
            # Update only the fields that were provided in the request
            update_data = {}
            if request.title is not None:
                update_data["title"] = request.title
            if request.llm_model is not None:
                # Validate model if provided
                llm_model = request.llm_model.strip() if request.llm_model else ""
                if llm_model == 'string':
                    llm_model = DEFAULT_MODEL
                if not llm_model:
                    llm_model = DEFAULT_MODEL
                update_data["llm_model"] = llm_model
            if request.status is not None:
                update_data["status"] = request.status
            if request.session_metadata is not None:
                update_data["session_metadata"] = request.session_metadata
            
            # Apply updates
            for field, value in update_data.items():
                setattr(chat_session, field, value)
            
            session.add(chat_session)
            session.commit()
            session.refresh(chat_session)
            
            return ChatSessionResponse(
                id=chat_session.id,
                title=chat_session.title,
                created_at=chat_session.created_at.isoformat() if chat_session.created_at else None,
                llm_model=chat_session.llm_model,
                user_id=chat_session.user_id,
                status=chat_session.status,
                session_metadata=chat_session.session_metadata
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating chat session: {str(e)}")

@router.post("/chat_sessions", response_model=ChatSessionResponse)
async def create_chat_session(request: CreateChatSessionRequest):
    """
    Create a new chat session and return its metadata.
    
    Creates a new chat session with specified parameters and returns the session details.
    """
    try:
        llm_model = request.llm_model.strip() if request.llm_model else ""
        if llm_model == 'string':
            llm_model = DEFAULT_MODEL

        if not llm_model:
            llm_model = DEFAULT_MODEL

        with get_session() as session:
            chat_session = ChatSession(
                title=request.title,
                llm_model=llm_model,
                user_id=request.user_id,
                status=request.status,
                session_metadata=request.session_metadata
            )
            session.add(chat_session)
            session.commit()
            session.refresh(chat_session)
            return ChatSessionResponse(
                id=chat_session.id,
                title=chat_session.title,
                created_at=chat_session.created_at.isoformat() if chat_session.created_at else None,
                llm_model=chat_session.llm_model,
                user_id=chat_session.user_id,
                status=chat_session.status,
                session_metadata=chat_session.session_metadata
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating chat session: {str(e)}")

@router.get("/{session_id}/messages", response_model=ChatMessagesListResponse)
async def get_chat_messages(session_id: int):
    """
    Get all messages for a given chat session.
    
    Returns all messages in a chat session with their metadata 
    (sources, confidence, hallucination detection).
    """
    try:
        with get_session() as session:
            statement = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp)
            messages = session.exec(statement).all()
            messages_list = []
            for message in messages:
                messages_list.append(ChatMessageResponse(
                    id=message.id,
                    role=message.role,
                    content=message.content,
                    timestamp=message.timestamp.isoformat() if message.timestamp else None,
                    sources=message.sources,
                    confidence=message.confidence,
                    hallucination=message.hallucination
                ))
            return ChatMessagesListResponse(
                message="Messages retrieved successfully",
                total_messages=len(messages_list),
                messages=messages_list
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving messages: {str(e)}")


# Simple WebSocket endpoint for single-user chat
@router.websocket("/{session_id}/ws")
async def websocket_endpoint(websocket: WebSocket, session_id: int):
    """
    Simple WebSocket endpoint for real-time chat streaming.
    
    Provides real-time chat message streaming for a single user.
    """
    await websocket.accept()
    
    try:
        while True:
            # Wait for message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat_message":
                try:
                    from chat_logic.message_handler import handle_chat_message_stream
                    
                    # Send acknowledgment
                    await websocket.send_text(json.dumps({
                        "type": "ack", 
                        "message": "Message received"
                    }))
                    
                    # Stream the response
                    async for chunk in handle_chat_message_stream(
                        session_id,
                        message_data.get("question", ""),
                        model=message_data.get("model", "mistral"),
                        selected_document_ids=message_data.get("selected_document_ids"),
                        search_mode=message_data.get("search_mode", "all")
                    ):
                        await websocket.send_text(json.dumps(chunk))
                        
                except Exception as e:
                    error_message = {
                        "type": "error",
                        "content": f"Error processing message: {str(e)}"
                    }
                    await websocket.send_text(json.dumps(error_message))
            
            elif message_data.get("type") == "ping":
                # Simple ping/pong for connection health
                await websocket.send_text(json.dumps({"type": "pong"}))
                    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"WebSocket error for session {session_id}: {e}")
        await websocket.close()


@router.get("/models")
async def get_available_models():
    """
    Get list of available models from configuration.
    
    Returns all models defined in the config file with default model marked.
    """
    try:
        from config import get_allowed_models, get_openai_models, get_default_model
        
        allowed_models = get_allowed_models()
        openai_models = get_openai_models()
        default_model = get_default_model()
        
        models = []
        
        # Add default model first (Mistral)
        if default_model in allowed_models:
            models.append({
                "id": default_model,
                "name": default_model.title(),
                "description": "Local model - fast and efficient",
                "provider": "Local",
                "maxTokens": 4096,
                "isAvailable": True,
                "default": True
            })
        
        # Add other models
        for model in allowed_models:
            if model != default_model:  # Skip default model as it's already added
                is_openai = model in openai_models
                models.append({
                    "id": model,
                    "name": model.replace("-", " ").title(),
                    "description": f"{'OpenAI' if is_openai else 'Local'} model",
                    "provider": "OpenAI" if is_openai else "Local",
                    "maxTokens": 8192 if is_openai else 4096,
                    "isAvailable": True,
                    "default": False
                })
        
        return {
            "models": models,
            "default_model": default_model
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving models: {str(e)}")
