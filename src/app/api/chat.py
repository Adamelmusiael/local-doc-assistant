from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path
from src.db.database import get_session
from src.db.models import ChatSession, ChatMessage
from sqlmodel import select
from sqlalchemy import func
from sqlmodel import delete
import os
import openai

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

class CreateChatSessionRequest(BaseModel):
    title: str
    llm_model: str | None = None
    user_id: str | None = None
    status: str | None = None
    session_metadata: str | None = None

class ChatRequest(BaseModel):
    question: str
    model: str | None = None  # opcjonalnie, domyślnie "mistral"

@router.post("/")
def chat_message(request: ChatMessage):
    """Send a chat message"""

    query = request.question
    if not query:
        return {"message": "Query cannot be empty"}
    
    # Search for relevant chunks
    top_chunks = search_documents(query, limit=5)
    
    if not top_chunks:
        return {"error": "No relevant documents found"}
    
    # Extract text from chunks for context
    context = "\n\n".join([chunk["text"] for chunk in top_chunks])

    prompt = f"""
    Based on the following context, answer the question. Answer in language that is used in the question:
   
    {context}
    
    Question: {query}
    Answer:
    """

    try:
        # Send request to Ollama/Mistral
        response = requests.post(
            LLM_API_URL,
            json={"model": "mistral", "prompt": prompt, "stream": False}
        )

        if response.status_code != 200:
            return {"error": "Failed to generate response from model"}

        # Parse the response
        response_data = response.json()
        generated_text = response_data.get("response", "")
        
        # Return complete response
        return {
            "question": query,
            "answer": generated_text,
            "matched_chunks": [
                {
                    "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                    "score": chunk["score"],
                    "metadata": chunk["metadata"]
                }
                for chunk in top_chunks
            ],
            "total_chunks_found": len(top_chunks)
        }
        
    except requests.exceptions.RequestException as e:
        return {"error": f"Failed to connect to Mistral model: {str(e)}"}
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse model response: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

@router.post("/{session_id}/message")
async def chat_message_with_metadata(session_id: int, request: ChatRequest):
    """Send a chat message, get answer with metadata (sources, confidence, hallucination)"""
    try:
        model = request.model
        if not model or model == "string":
            with get_session() as session:
                chat_session = session.exec(select(ChatSession).where(ChatSession.id == session_id)).first()
                if chat_session and chat_session.llm_model:
                    model = chat_session.llm_model
                else:
                    model = "mistral"
        result = handle_chat_message(session_id, request.question, model=model)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error handling chat message: {str(e)}")


@router.get("/chat_sessions")
async def list_chat_sessions():
    """List all chat sessions with metadata from database"""
    try:
        with get_session() as session:
            statement = select(ChatSession)
            sessions = session.exec(statement).all()
            sessions_list = []
            for session in sessions:
                sessions_list.append({
                    "id": session.id,
                    "title": session.title,
                    "created_at": session.created_at.isoformat() if session.created_at else None,
                    "llm_model": session.llm_model,
                    "user_id": session.user_id,
                    "status": session.status,
                    "session_metadata": session.session_metadata
                })
            return {
                "message": "Chat sessions retrieved successfully",
                "total_sessions": len(sessions_list),
                "sessions": sessions_list
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat sessions: {str(e)}")

@router.get("/chat_sessions/{session_id}")
async def get_chat_session(session_id: int):
    """Get specific chat session metadata by ID"""
    try:
        with get_session() as session:
            chat_session = session.get(ChatSession, session_id)
            if not chat_session:
                raise HTTPException(status_code=404, detail="Chat session not found")
            return {
                "id": chat_session.id,
                "title": chat_session.title,
                "created_at": chat_session.created_at.isoformat() if chat_session.created_at else None,
                "llm_model": chat_session.llm_model,
                "user_id": chat_session.user_id,
                "status": chat_session.status,
                "session_metadata": chat_session.session_metadata
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat session: {str(e)}")

@router.delete("/chat_sessions/{session_id}")
async def delete_chat_session(session_id: int):
    """Delete a chat session by ID (and its messages)"""
    try:
        with get_session() as session:
            chat_session = session.get(ChatSession, session_id)
            if not chat_session:
                raise HTTPException(status_code=404, detail="Chat session not found")
            # Poprawne usuwanie wszystkich wiadomości dla tej sesji
            session.exec(delete(ChatMessage).where(ChatMessage.session_id == session_id))
            session.delete(chat_session)
            session.commit()
            return {"message": "Chat session and its messages deleted successfully", "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat session: {str(e)}")

@router.post("/chat_sessions")
async def create_chat_session(request: CreateChatSessionRequest):
    """Create a new chat session and return its metadata"""
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
            return {
                "id": chat_session.id,
                "title": chat_session.title,
                "created_at": chat_session.created_at.isoformat() if chat_session.created_at else None,
                "llm_model": chat_session.llm_model,
                "user_id": chat_session.user_id,
                "status": chat_session.status,
                "session_metadata": chat_session.session_metadata
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating chat session: {str(e)}")

@router.get("/{session_id}/messages")
async def get_chat_messages(session_id: int):
    """Get all messages for a given chat session"""
    try:
        with get_session() as session:
            statement = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp)
            messages = session.exec(statement).all()
            messages_list = []
            for message in messages:
                messages_list.append({
                    "id": message.id,
                    "role": message.role,
                    "content": message.content,
                    "timestamp": message.timestamp.isoformat() if message.timestamp else None,
                    "sources": message.sources,
                    "confidence": message.confidence,
                    "hallucination": message.hallucination
                })
            return {
                "message": "Messages retrieved successfully",
                "total_messages": len(messages_list),
                "messages": messages_list
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving messages: {str(e)}")
