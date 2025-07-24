import sys
import os
from datetime import datetime

# Ensure src/ is in sys.path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from chat_logic.session_manager import create_chat_session, delete_chat_session
from chat_logic.message_store import store_chat_message, get_chat_history

def test_message_store():
    print("--- TEST: Chat Message Store ---")
    # 1. Create a chat session
    session = create_chat_session(title="Test Session", llm_model="gpt-4", user_id="test_user")
    print(f"Created session: {session.id}, title: {session.title}")

    # 2. Store user message
    user_msg = store_chat_message(
        session_id=session.id,
        role="user",
        content="Hello, how are you?",
        metadata={"sources": None, "confidence": 1.0, "token_count": 5}
    )
    print(f"Stored user message: {user_msg.id}")

    # 3. Store assistant message
    model_msg = store_chat_message(
        session_id=session.id,
        role="assistant",
        content="I'm fine, thank you! How can I help you today?",
        metadata={"sources": "[\"doc1.pdf\"]", "confidence": 0.98, "hallucination": 0.01, "token_count": 12}
    )
    print(f"Stored assistant message: {model_msg.id}")

    # 4. Store another user message
    user_msg2 = store_chat_message(
        session_id=session.id,
        role="user",
        content="Tell me a joke.",
        metadata={"token_count": 4}
    )
    print(f"Stored user message: {user_msg2.id}")

    # 5. Get chat history
    history = get_chat_history(session.id)
    print("\nChat history:")
    for msg in history:
        print(msg)

    # 6. Clean up: delete session (cascade should delete messages if set up)
    deleted = delete_chat_session(session.id)
    print(f"Session deleted: {deleted}")

if __name__ == "__main__":
    test_message_store() 