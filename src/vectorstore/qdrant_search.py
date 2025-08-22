import hashlib
import numpy as np
import os
import uuid
from typing import List, Dict, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Mock embedder function for testing when real embedder is not available
def mock_embed_text(text: str) -> List[float]:
    """Mock embedding function that returns a simple vector"""
    hash_obj = hashlib.md5(text.encode())
    seed = int(hash_obj.hexdigest()[:8], 16)
    np.random.seed(seed)
    return np.random.rand(1024).tolist()

try:
    from .embedder import embed_text
except ImportError:
    try:
        from embedder import embed_text
    except ImportError:
        embed_text = mock_embed_text

try:
    from security import validate_document_access
except ImportError:
    validate_document_access = None


QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")

def get_client():
    """Get Qdrant client instance"""
    return QdrantClient(QDRANT_URL)

def search_documents(query: str, collection_name="documents", limit: int = 5, model_name: str = None) -> List[Dict]:
    """
    Main search function - finds documents similar to the given query.
    
    Args:
        query (str): Search query text
        collection_name (str): Name of the Qdrant collection to search in
        limit (int): Maximum number of results to return (default: 5)
        model_name (str): Name of the model requesting access (for confidentiality filtering)
    
    Returns:
        List[Dict]: List of search results with scores and metadata (filtered by confidentiality)
    """
    try:
        # Convert query text to vector
        query_vector = embed_text(query)
        
        # Get client instance
        client = get_client()
        
        # Search in Qdrant
        search_result = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit
        )
        
        # Format results
        results = []
        for hit in search_result:
            result = {
                "id": hit.id,
                "score": float(hit.score),
                "text": hit.payload.get("text", ""),
                "metadata": {
                    "filename": hit.payload.get("filename", ""),
                    "document_id": hit.payload.get("document_id", ""),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                    "confidentiality": hit.payload.get("confidentiality", ""),
                    "department": hit.payload.get("department", ""),
                    "client": hit.payload.get("client", "")
                }
            }
            results.append(result)
        
        if model_name:
            try:
                if validate_document_access is None:
                    pass  # Skip filtering if module not available
                else:
                    results = validate_document_access(results, model_name)
            except ImportError:
                pass
        
        return results
        
    except Exception as e:
        print(f"Search error: {e}")
        return []

def search_with_filters(
    query: str, 
    limit: int = 5, 
    filters: Optional[Dict[str, str]] = None,
    document_ids: Optional[List[int]] = None,
    model_name: str = None
) -> List[Dict]:
    """
    Advanced search function with metadata filtering and document ID filtering.
    
    Args:
        query (str): Search query text
        limit (int): Maximum number of results to return
        filters (Dict): Optional filters for metadata (e.g., {"department": "HR"})
        document_ids (List[int]): Optional list of document IDs to search in
        model_name (str): Name of the model requesting access (for confidentiality filtering)
    
    Returns:
        List[Dict]: Filtered search results
    """
    try:
        query_vector = embed_text(query)
        client = get_client()
        
        # Build filter conditions
        conditions = []
        
        # Add metadata filters (existing functionality)
        if filters:
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                )
        
        # Add document ID filter (new functionality)
        if document_ids:
            doc_conditions = []
            for doc_id in document_ids:
                doc_conditions.append(
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=doc_id)
                    )
                )
            # If we have both metadata filters AND document IDs
            if conditions:
                # Metadata filters must match AND document must be in selected list
                conditions.append(Filter(should=doc_conditions))
            else:
                # Only document ID filtering
                conditions = [Filter(should=doc_conditions)]
        
        # Create final filter
        query_filter = None
        if conditions:
            if len(conditions) == 1:
                query_filter = conditions[0]
            else:
                query_filter = Filter(must=conditions)
        
        # Search in Qdrant
        search_result = client.search(
            collection_name="documents",
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit
        )
        
        # Format results (same as before)
        results = []
        for hit in search_result:
            result = {
                "id": hit.id,
                "score": float(hit.score),
                "text": hit.payload.get("text", ""),
                "metadata": {
                    "filename": hit.payload.get("filename", ""),
                    "document_id": hit.payload.get("document_id", ""),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                    "confidentiality": hit.payload.get("confidentiality", ""),
                    "department": hit.payload.get("department", ""),
                    "client": hit.payload.get("client", "")
                }
            }
            results.append(result)
        
        # Apply confidentiality filtering if model_name is provided
        if model_name:
            try:
                if validate_document_access is None:
                    pass  # Skip filtering if module not available
                else:
                    results = validate_document_access(results, model_name)
            except ImportError:
                pass
        
        return results
        
    except Exception as e:
        print(f"Filtered search error: {e}")
        return []

def search_documents_by_ids(
    query: str, 
    document_ids: List[int],
    limit: int = 5,
    model_name: str = None
) -> List[Dict]:
    """
    Search only within specified document IDs using semantic similarity.
    
    Args:
        query (str): Search query text
        document_ids (List[int]): List of document IDs to search within
        limit (int): Maximum number of results to return
        model_name (str): Name of the model requesting access (for confidentiality filtering)
    
    Returns:
        List[Dict]: Search results filtered by document IDs and confidentiality
    """
    try:
        query_vector = embed_text(query)
        client = get_client()
        
        # Create filter for document IDs
        doc_conditions = []
        for doc_id in document_ids:
            doc_conditions.append(
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=doc_id)
                )
            )
        
        query_filter = Filter(should=doc_conditions)
        
        # Search in Qdrant with document filter
        search_result = client.search(
            collection_name="documents",
            query_vector=query_vector,
            query_filter=query_filter,
            limit=limit
        )
        
        # Format results
        results = []
        for hit in search_result:
            result = {
                "id": hit.id,
                "score": float(hit.score),
                "text": hit.payload.get("text", ""),
                "metadata": {
                    "filename": hit.payload.get("filename", ""),
                    "document_id": hit.payload.get("document_id", ""),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                    "confidentiality": hit.payload.get("confidentiality", ""),
                    "department": hit.payload.get("department", ""),
                    "client": hit.payload.get("client", "")
                }
            }
            results.append(result)
        
        # Apply confidentiality filtering if model_name is provided
        if model_name:
            try:
                if validate_document_access is None:
                    pass  # Skip filtering if module not available
                else:
                    results = validate_document_access(results, model_name)
            except ImportError:
                pass
        
        return results
        
    except Exception as e:
        print(f"Document ID search error: {e}")
        return []

def get_collection_info() -> Dict:
    """Get information about the documents collection."""
    try:
        client = get_client()
        collection_info = client.get_collection("documents")
        return {
            "status": "exists",
            "points_count": collection_info.points_count,
            "vectors_config": collection_info.config.params.vectors
        }
    except Exception as e:
        return {
            "status": "not_found",
            "error": str(e)
        }

def check_connection() -> bool:
    """Check if Qdrant server is accessible."""
    try:
        client = get_client()
        collections = client.get_collections()
        return True
    except Exception as e:
        print(f"Cannot connect to Qdrant: {e}")
        return False
