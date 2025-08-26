import asyncio
import json
import os
from typing import AsyncGenerator, Dict, Any, Optional, List

import requests
from openai import AsyncOpenAI, OpenAI

from .prompt_builder import build_prompt
from .message_store import get_chat_history as _get_chat_history, store_chat_message as _store_chat_message
from .query_analyzer import analyze_query_complexity, calculate_optimal_chunks
from vectorstore.qdrant_search import search_documents, search_documents_by_ids
from db.models import Document

try:
    from config import get_openai_models as _get_openai_models, get_allowed_models as _get_allowed_models, get_ollama_model_name
except ImportError:
    _get_openai_models = None
    _get_allowed_models = None
    get_ollama_model_name = None

try:
    from security import validate_model_document_compatibility
except ImportError:
    validate_model_document_compatibility = None

LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:11434/api/generate")

def get_openai_models():
    """Get OpenAI models from config (lazy loading)"""
    if _get_openai_models is None:
        raise ImportError("Config module not available")
    return _get_openai_models()

def get_allowed_models():
    """Get allowed models from config (lazy loading)"""
    if _get_allowed_models is None:
        raise ImportError("Config module not available")
    return _get_allowed_models()


def get_chat_history(session_id):
    return _get_chat_history(session_id)

def generate_response(prompt, model="mistral"):
    if model in get_openai_models():
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024
        )
        print("model openai", model)
        return response.choices[0].message.content
    
    try:
        if get_ollama_model_name is None:
            raise ImportError("Config module not available")
        ollama_model = get_ollama_model_name(model)
        
        response = requests.post(
            LLM_API_URL,
            json={"model": ollama_model, "prompt": prompt, "stream": False}
        )
        if response.status_code != 200:
            return f"[Model error: {response.status_code}]"
        response_data = response.json()
        print(f"model local: {model} -> {ollama_model}")
        return response_data.get("response", "")
    except Exception as e:
        return f"[Model error: {str(e)}]"


async def generate_response_stream(prompt: str, model: str = "mistral") -> AsyncGenerator[str, None]:
    """
    Generate streaming response from LLM.
    Yields chunks of text as they are generated.
    """
    if model in get_openai_models():
        try:
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            stream = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1024,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"[OpenAI Error: {str(e)}]"
    else:
        try:
            if get_ollama_model_name is None:
                raise ImportError("Config module not available")
            ollama_model = get_ollama_model_name(model)
            
            response = requests.post(
                LLM_API_URL,
                json={"model": ollama_model, "prompt": prompt, "stream": True},
                stream=True
            )
            
            if response.status_code != 200:
                yield f"[Model error: {response.status_code}]"
                return
            
            for line in response.iter_lines():
                if line:
                    try:
                        chunk_data = json.loads(line.decode('utf-8'))
                        if 'response' in chunk_data:
                            yield chunk_data['response']
                        if chunk_data.get('done', False):
                            break
                    except json.JSONDecodeError:
                        continue
                        
        except Exception as e:
            yield f"[Model error: {str(e)}]"

def extract_sources(chunks):
    """
    Extract sources from chunks and return in the expected format.
    """
    sources = []
    for chunk in chunks:
        if isinstance(chunk, dict):
            source = {
                "text": chunk.get("text", ""),
                "score": chunk.get("score", 0.0),
                "metadata": chunk.get("metadata", {})
            }
            sources.append(source)
    
    return sources

def score_confidence(answer, chunks):
    return None

def score_hallucination(answer, chunks):
    return None

def search_documents_adaptive(
    user_question: str,
    selected_document_ids: Optional[List[int]] = None,
    search_mode: str = "all",
    model_name: str = None
) -> tuple[List[Dict], Dict]:
    """
    Perform adaptive document search based on query complexity analysis
    
    Args:
        user_question (str): The user's query
        selected_document_ids (List[int], optional): Selected document IDs
        search_mode (str): Search mode ("all", "selected_only", "hybrid")
        model_name (str): Model name for confidentiality filtering
        
    Returns:
        tuple: (chunks, query_analysis) - Retrieved chunks and analysis details
    """
    # Analyze query complexity
    query_analysis = analyze_query_complexity(user_question)
    
    # Calculate optimal chunk count considering available documents
    available_doc_count = len(selected_document_ids) if selected_document_ids else None
    optimal_chunks = calculate_optimal_chunks(query_analysis, available_doc_count)
    
    # Perform search based on mode with adaptive chunk count
    if search_mode == "selected_only" and selected_document_ids:
        top_chunks = search_documents_by_ids(
            user_question,
            selected_document_ids,
            limit=optimal_chunks,
            model_name=model_name
        )
        
    elif search_mode == "hybrid" and selected_document_ids:
        # Distribute chunks between selected and general search
        selected_chunk_ratio = 0.6  # 60% from selected documents
        selected_chunks_count = max(1, int(optimal_chunks * selected_chunk_ratio))
        additional_chunks_count = optimal_chunks - selected_chunks_count
        
        # Get chunks from selected documents first
        selected_chunks = search_documents_by_ids(
            user_question,
            selected_document_ids,
            limit=selected_chunks_count,
            model_name=model_name
        )
        
        # Get additional chunks from all documents
        additional_chunks = search_documents(
            user_question, 
            limit=additional_chunks_count, 
            model_name=model_name
        )
        
        # Combine results (selected chunks first, then additional)
        top_chunks = selected_chunks + additional_chunks
        
    else:
        # Standard semantic search across all documents
        top_chunks = search_documents(
            user_question, 
            limit=optimal_chunks, 
            model_name=model_name
        )
    
    # Add analysis info to be used in prompt building
    query_analysis["chunks_retrieved"] = len(top_chunks)
    query_analysis["chunks_requested"] = optimal_chunks
    
    return top_chunks, query_analysis

def store_chat_message(session_id, role, content, sources=None, confidence=None, hallucination=None):
    metadata = {
        "sources": json.dumps(sources) if sources is not None else None,
        "confidence": confidence,
        "hallucination": hallucination
    }
    _store_chat_message(session_id, role, content, metadata=metadata)

def handle_chat_message(
    session_id,
    user_question,
    model="mistral",
    selected_document_ids=None,
    search_mode="all"
):
    allowed_models = get_allowed_models()
    if model.lower() not in [m.lower() for m in allowed_models]:
        raise ValueError(f"Model '{model}' is not supported. Please choose one of: {allowed_models}")
    
    # Confidentiality validation
    try:
        from security import validate_model_document_compatibility
        is_valid, error_message = validate_model_document_compatibility(model, selected_document_ids)
        if not is_valid:
            raise ValueError(error_message)
    except ImportError:
        # If security module is not available, continue without validation
        pass
    
    chat_history = get_chat_history(session_id)
    
    # Use adaptive search instead of fixed chunk counts
    top_chunks, query_analysis = search_documents_adaptive(
        user_question=user_question,
        selected_document_ids=selected_document_ids,
        search_mode=search_mode,
        model_name=model
    )
    
    # Build prompt with additional context about the analysis
    prompt = build_prompt(top_chunks, chat_history, user_question, query_analysis)
    store_chat_message(session_id, role="user", content=user_question)
    answer = generate_response(prompt, model=model)
    sources = extract_sources(top_chunks)
    confidence = None
    hallucination = None
    store_chat_message(session_id, role="assistant", content=answer, sources=sources, confidence=confidence, hallucination=hallucination)
    
    return {
        "answer": answer,
        "model": model,
        "sources": sources,
        "confidence": confidence,
        "hallucination": hallucination,
        "search_mode": search_mode,
        "selected_documents": selected_document_ids,
        "chunks_used": len(top_chunks),
        "query_analysis": {
            "complexity_level": query_analysis["complexity_level"],
            "query_type": query_analysis["query_type"],
            "chunks_requested": query_analysis["chunks_requested"],
            "chunks_retrieved": query_analysis["chunks_retrieved"]
        }
    } 


async def handle_chat_message_stream(
    session_id: int,
    user_question: str,
    model: str = "mistral",
    selected_document_ids: Optional[List[int]] = None,
    search_mode: str = "all"
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Handle chat message with streaming response.
    Yields chunks of the response as they are generated.
    """
    try:
        allowed_models = get_allowed_models()
        if model.lower() not in [m.lower() for m in allowed_models]:
            yield {
                "type": "error",
                "content": f"Model '{model}' is not supported. Choose from: {allowed_models}"
            }
            return
        
        try:
            if validate_model_document_compatibility is None:
                pass  # Skip validation if module not available
            else:
                is_valid, error_message = validate_model_document_compatibility(model, selected_document_ids)
                if not is_valid:
                    yield {
                        "type": "error",
                        "content": error_message
                    }
                    return
        except ImportError:
            pass
        
        yield {"type": "status", "content": "Searching documents..."}
        
        chat_history = get_chat_history(session_id)
        
        # Use adaptive search instead of fixed chunk counts
        top_chunks, query_analysis = search_documents_adaptive(
            user_question=user_question,
            selected_document_ids=selected_document_ids,
            search_mode=search_mode,
            model_name=model
        )
        
        # Send sources info with analysis details
        yield {
            "type": "sources",
            "sources": extract_sources(top_chunks),
            "chunks_used": len(top_chunks),
            "query_analysis": {
                "complexity": query_analysis["complexity_level"],
                "query_type": query_analysis["query_type"],
                "chunks_requested": query_analysis["chunks_requested"],
                "chunks_retrieved": query_analysis["chunks_retrieved"]
            }
        }
        
        yield {"type": "status", "content": "Generating response..."}
        prompt = build_prompt(top_chunks, chat_history, user_question, query_analysis)
        
        store_chat_message(session_id, role="user", content=user_question)
        
        full_response = ""
        async for chunk in generate_response_stream(prompt, model=model):
            full_response += chunk
            yield {
                "type": "chunk",
                "content": chunk
            }
        
        sources = extract_sources(top_chunks)
        confidence = score_confidence(full_response, top_chunks)
        hallucination = score_hallucination(full_response, top_chunks)
        
        store_chat_message(
            session_id,
            role="assistant",
            content=full_response,
            sources=sources,
            confidence=confidence,
            hallucination=hallucination
        )
        
        yield {
            "type": "metadata",
            "content": {
                "model": model,
                "confidence": confidence,
                "hallucination": hallucination,
                "search_mode": search_mode,
                "selected_documents": selected_document_ids,
                "total_response": full_response
            }
        }
        
    except Exception as e:
        yield {
            "type": "error",
            "content": f"Error in streaming handler: {str(e)}"
        } 