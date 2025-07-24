from sqlmodel import Session
from db.database import engine
from db.models import ChatSession
from typing import Optional

def create_chat_session(title: str, llm_model: str, user_id: Optional[str] = None, status: Optional[str] = None, session_metadata: Optional[str] = None) -> ChatSession:
    """Create a new chat session and return the ChatSession object."""
    with Session(engine) as session:
        chat_session = ChatSession(
            title=title,
            llm_model=llm_model,
            user_id=user_id,
            status=status,
            session_metadata=session_metadata
        )
        session.add(chat_session)
        session.commit()
        session.refresh(chat_session)
        return chat_session

def delete_chat_session(session_id: int) -> bool:
    """Delete a chat session by id. Returns True if deleted, False if not found."""
    with Session(engine) as session:
        chat_session = session.get(ChatSession, session_id)
        if not chat_session:
            return False
        session.delete(chat_session)
        session.commit()
        return True 