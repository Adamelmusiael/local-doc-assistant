from .prompt_builder import build_prompt
from .message_store import get_chat_history as _get_chat_history, store_chat_message as _store_chat_message
import requests
import json
from vectorstore.qdrant_search import search_documents, search_documents_by_ids
from db.models import Document
import os
import openai
LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:11434/api/generate")


def get_chat_history(session_id):
    return _get_chat_history(session_id)

def generate_response(prompt, model="mistral"):
    if model in OPENAI_MODELS:
        openai.api_key = os.getenv("OPENAI_API_KEY")
        response = openai.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024
        )
        print("model openai", model)
        return response.choices[0].message.content
    # Local model (e.g. Mistral)
    try:
        response = requests.post(
            LLM_API_URL,
            json={"model": model, "prompt": prompt, "stream": False}
        )
        if response.status_code != 200:
            return f"[Model error: {response.status_code}]"
        response_data = response.json()
        print("model local", model)
        return response_data.get("response", "")
    except Exception as e:
        return f"[Model error: {str(e)}]"

def extract_sources(chunks):
    """
    Extract sources from chunks and return in the expected format.
    """
    sources = []
    for chunk in chunks:
        if isinstance(chunk, dict):
            # Create source object in expected format
            source = {
                "text": chunk.get("text", ""),
                "score": chunk.get("score", 0.0),
                "metadata": chunk.get("metadata", {})
            }
            sources.append(source)
    
    return sources

def score_confidence(answer, chunks):
    # TODO: calculate confidence score
    return None

def score_hallucination(answer, chunks):
    # TODO: calculate hallucination score
    return None

def store_chat_message(session_id, role, content, sources=None, confidence=None, hallucination=None):
    metadata = {
        "sources": json.dumps(sources) if sources is not None else None,
        "confidence": confidence,
        "hallucination": hallucination
    }
    _store_chat_message(session_id, role, content, metadata=metadata)

OPENAI_MODELS = {"gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano"}

ALLOWED_MODELS = ["mistral", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-4o", "gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano"]

def handle_chat_message(
    session_id,
    user_question,
    model="mistral",
    selected_document_ids=None,
    search_mode="all"
):
    # Model validation
    if model.lower() not in [model.lower() for model in ALLOWED_MODELS]:
        raise ValueError(f"Model '{model}' is not supported. Please choose one of: {ALLOWED_MODELS}")
    
    # 1. Get history
    chat_history = get_chat_history(session_id)
    
    # 2. Get chunks based on search mode
    if search_mode == "selected_only" and selected_document_ids:
        # Get semantically relevant chunks from selected documents only
        top_chunks = search_documents_by_ids(
            user_question,
            selected_document_ids,
            limit=5
        )
        
    elif search_mode == "hybrid" and selected_document_ids:
        # Get chunks from selected documents first
        selected_chunks = search_documents_by_ids(
            user_question,
            selected_document_ids,
            limit=3
        )
        
        # Get additional chunks from all documents
        additional_chunks = search_documents(user_question, limit=2)
        
        # Combine results (selected chunks first, then additional)
        top_chunks = selected_chunks + additional_chunks
        
    else:
        # Standard semantic search across all documents
        top_chunks = search_documents(user_question, limit=5)
    
    # 3. Build prompt
    prompt = build_prompt(top_chunks, chat_history, user_question)
    # 4. Store user question
    store_chat_message(session_id, role="user", content=user_question)
    # 5. Generate response
    answer = generate_response(prompt, model=model)
    # 6. Extract sources
    sources = extract_sources(top_chunks)
    # 7. Score confidence
    confidence = None
    # 8. Score hallucination    
    hallucination = None
    # 9. Store chat message
    store_chat_message(session_id, role="assistant", content=answer, sources=sources, confidence=confidence, hallucination=hallucination)
    
    return {
        "answer": answer,
        "model": model,
        "sources": sources,
        "confidence": confidence,
        "hallucination": hallucination,
        "search_mode": search_mode,
        "selected_documents": selected_document_ids,
        "chunks_used": len(top_chunks)
    } 