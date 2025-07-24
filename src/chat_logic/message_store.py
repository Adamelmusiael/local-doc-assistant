from sqlmodel import Session, select
from db.database import engine
from db.models import ChatMessage
from typing import List, Optional, Any, Dict
from datetime import datetime


def get_chat_history(session_id: int) -> List[Dict[str, Any]]:
    """Fetch chat history for a given session_id. Returns list of message dicts."""
    with Session(engine) as session:
        messages = session.exec(
            select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp)
        ).all()
        return [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp,
                "sources": msg.sources,
                "confidence": msg.confidence,
                "hallucination": msg.hallucination,
                "token_count": getattr(msg, "token_count", None),
            }
            for msg in messages
        ]

def store_chat_message(
    session_id: int,
    role: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
    timestamp: Optional[datetime] = None
) -> ChatMessage:
    """Store a chat message in the database. Metadata can include sources, confidence, hallucination, token_count, etc."""
    metadata = metadata or {}
    with Session(engine) as session:
        chat_message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            timestamp=timestamp or datetime.utcnow(),
            sources=metadata.get("sources"),
            confidence=metadata.get("confidence"),
            hallucination=metadata.get("hallucination"),
        )
        # Optionally handle token_count if present in model and metadata
        if hasattr(chat_message, "token_count") and "token_count" in metadata:
            setattr(chat_message, "token_count", metadata["token_count"])
        session.add(chat_message)
        session.commit()
        session.refresh(chat_message)
        return chat_message
