from .prompt_builder import build_prompt
from .message_store import get_chat_history as _get_chat_history, store_chat_message as _store_chat_message
import requests
import json
from vectorstore.qdrant_search import search_documents
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

def extract_sources(answer, chunks):
    # Simple heuristic: return document IDs of chunks if available
    sources = set()
    for chunk in chunks:
        if isinstance(chunk, dict):
            doc_id = chunk.get("metadata", {}).get("document_id") or chunk.get("document_id")
            if doc_id is not None:
                sources.add(doc_id)
    return list(sources)

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

def handle_chat_message(session_id, user_question, model="mistral"):
    # Model validation
    if model.lower() not in [model.lower() for model in ALLOWED_MODELS]:
        raise ValueError(f"Model '{model}' is not supported. Please choose one of: {ALLOWED_MODELS}")
    # 1. Get history
    chat_history = get_chat_history(session_id)
    # 2. Get chunks
    top_chunks = search_documents(user_question, limit=5)
    # 3. build_prompt
    prompt = build_prompt(top_chunks, chat_history, user_question)
    # --- SAVE USER QUESTION ---
    store_chat_message(session_id, role="user", content=user_question)
    # 4. generate_response (handles OpenAI and local)
    answer = generate_response(prompt, model=model)
    # 5. extract_sources
    sources = extract_sources(answer, top_chunks)
    # 6. score_confidence (placeholder)
    confidence = None
    # 7. score_hallucination (placeholder)
    hallucination = None
    # 8. store_chat_message (assistant)
    store_chat_message(session_id, role="assistant", content=answer, sources=sources, confidence=confidence, hallucination=hallucination)
    # 9. Return json
    return {
        "answer": answer,
        "model": model,
        "sources": sources,
        "confidence": confidence,
        "hallucination": hallucination
    } 