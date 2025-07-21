from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path
from src.db.database import get_session
from src.db.models import Document
from sqlmodel import select
from sqlalchemy import func

# Add the src directory to Python path
src_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(src_path))

from vectorstore.qdrant_search import search_documents
from vectorstore.qdrant_indexer import index_chunks
from file_ingestion.preprocessor import preprocess_document_to_chunks
import requests
import json

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "upload_files" 

class ChatMessage(BaseModel):
    question: str

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
            "http://localhost:11434/api/generate",
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

@router.get("/history")
async def chat_history():
    """Get chat history"""
    return {"message": "Chat history - not implemented yet"}

@router.delete("/history")
async def clear_chat_history():
    """Clear chat history"""
    return {"message": "!NOT IMPLEMENTED YET! Chat history cleared"}
