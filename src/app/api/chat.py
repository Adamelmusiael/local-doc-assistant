from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def chat_message():
    """Send a chat message"""
    return {"message": "Chat endpoint - not implemented yet"}

@router.get("/history")
async def chat_history():
    """Get chat history"""
    return {"message": "Chat history - not implemented yet"}

@router.delete("/history")
async def clear_chat_history():
    """Clear chat history"""
    return {"message": "Chat history cleared"}
