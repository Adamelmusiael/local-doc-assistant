from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from typing import List, Dict, Optional
import uuid
import os

# Mock embedder function for testing when real embedder is not available
def mock_embed_text(text: str) -> List[float]:
    """Mock embedding function that returns a simple vector"""
    import hashlib
    import numpy as np
    
    # Create a deterministic "embedding" based on text hash
    hash_obj = hashlib.md5(text.encode())
    seed = int(hash_obj.hexdigest()[:8], 16)
    np.random.seed(seed)
    return np.random.rand(1024).tolist()

# Try to import real embedder, fallback to mock
try:
    from .embedder import embed_text
    
except ImportError:
    try:
        from embedder import embed_text
        
    except ImportError:
        embed_text = mock_embed_text
        

# Initialize Qdrant client
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")

def get_client():
    """Get Qdrant client instance"""
    return QdrantClient(QDRANT_URL)

def search_documents(query: str, collection_name="documents", limit: int = 5) -> List[Dict]:
    """
    Main search function - finds documents similar to the given query.
    
    Args:
        query (str): Search query text
        collection_name (str): Name of the Qdrant collection to search in
        limit (int): Maximum number of results to return (default: 5)
    
    Returns:
        List[Dict]: List of search results with scores and metadata
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
        
        return results
        
    except Exception as e:
        print(f" Search error: {e}")
        return []

def search_with_filters(query: str, limit: int = 5, filters: Optional[Dict[str, str]] = None) -> List[Dict]:
    """
    Advanced search function with metadata filtering.
    
    Args:
        query (str): Search query text
        limit (int): Maximum number of results to return
        filters (Dict): Optional filters for metadata (e.g., {"department": "HR"})
    
    Returns:
        List[Dict]: Filtered search results
    """
    try:
        # Convert query text to vector
        query_vector = embed_text(query)
        
        # Get client instance
        client = get_client()
        
        # Create filter conditions if provided
        query_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=value)
                    )
                )
            query_filter = Filter(must=conditions)
        
        # Search in Qdrant with filters
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
        
        return results
        
    except Exception as e:
        print(f"Filtered search error: {e}")
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
