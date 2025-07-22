from .prompt_builder import build_prompt
from .message_store import get_chat_history as _get_chat_history, store_chat_message as _store_chat_message
import requests
import json
from vectorstore.qdrant_search import search_documents
from db.models import Document



def get_chat_history(session_id):
    return _get_chat_history(session_id)

def generate_response(prompt, model="mistral"):
    # Wersja dla lokalnego modelu Mistral przez Ollama
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt, "stream": False}
        )
        if response.status_code != 200:
            return f"[Model error: {response.status_code}]"
        response_data = response.json()
        return response_data.get("response", "")
    except Exception as e:
        return f"[Model error: {str(e)}]"

def extract_sources(answer, chunks):
    # Prosta heurystyka: zwróć id dokumentów chunków, jeśli są dostępne
    sources = set()
    for chunk in chunks:
        if isinstance(chunk, dict):
            doc_id = chunk.get("metadata", {}).get("document_id") or chunk.get("document_id")
            if doc_id is not None:
                sources.add(doc_id)
    return list(sources)

def score_confidence(answer, chunks):
    # TODO: oblicz confidence score
    return None

def score_hallucination(answer, chunks):
    # TODO: oblicz hallucination score
    return None

def store_chat_message(session_id, role, content, sources=None, confidence=None, hallucination=None):
    metadata = {
        "sources": json.dumps(sources) if sources is not None else None,
        "confidence": confidence,
        "hallucination": hallucination
    }
    _store_chat_message(session_id, role, content, metadata=metadata)

ALLOWED_MODELS = ["mistral", "chatgpt"]

def handle_chat_message(session_id, user_question, model="mistral"):
    # Walidacja modelu
    if model.lower() not in ALLOWED_MODELS:
        raise ValueError(f"Model '{model}' is not supported. Please choose one of: {ALLOWED_MODELS}")
    # 1. Pobierz historię
    chat_history = get_chat_history(session_id)
    # 2. Pobierz chunki
    top_chunks = search_documents(user_question, limit=5)
    # 3. build_prompt
    prompt = build_prompt(top_chunks, chat_history, user_question)
    # 4. generate_response
    answer = generate_response(prompt, model=model)
    # 5. extract_sources
    sources = extract_sources(answer, top_chunks)
    # 6. score_confidence (placeholder)
    confidence = None
    # 7. score_hallucination (placeholder)
    hallucination = None
    # 8. store_chat_message
    store_chat_message(session_id, role="assistant", content=answer, sources=sources, confidence=confidence, hallucination=hallucination)
    # 9. Zwróć json
    return {
        "answer": answer,
        "sources": sources,
        "confidence": confidence,
        "hallucination": hallucination
    } 