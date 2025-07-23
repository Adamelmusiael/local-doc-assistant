#!/usr/bin/env python3
# Simple test file for Qdrant search

from qdrant_client import QdrantClient
from typing import List, Dict
import numpy as np

def mock_embed_text(text: str) -> List[float]:
    """Simple mock embedder for testing"""
    import hashlib
    hash_obj = hashlib.md5(text.encode())
    seed = int(hash_obj.hexdigest()[:8], 16)
    np.random.seed(seed)
    return np.random.rand(1024).tolist()

def search_documents(query: str, limit: int = 5) -> List[Dict]:
    """
    Main search function - finds documents similar to the given query.
    
    Args:
        query (str): Search query text  
        limit (int): Maximum number of results to return (default: 5)
    
    Returns:
        List[Dict]: List of search results with scores and metadata
    """
    print(f"Searching for: '{query}' (limit: {limit})")
    
    try:
        # Initialize client
        client = QdrantClient("http://localhost:6333")
        
        # Convert query to vector
        query_vector = mock_embed_text(query)
        
        # Search in Qdrant
        search_result = client.search(
            collection_name="documents",
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
                "filename": hit.payload.get("filename", ""),
                "chunk_index": hit.payload.get("chunk_index", 0)
            }
            results.append(result)
        
        print(f"Found {len(results)} results")
        return results
        
    except Exception as e:
        print(f"Search error: {e}")
        return []

if __name__ == "__main__":
    print("Testing simple Qdrant search...")
    
    # Test connection
    try:
        client = QdrantClient("http://localhost:6333")
        collections = client.get_collections()
        print(f"Connected to Qdrant. Collections: {[c.name for c in collections.collections]}")
    except Exception as e:
        print(f"Connection failed: {e}")
        exit(1)
    
    # Test search
    results = search_documents("test query", 3)
    for i, result in enumerate(results, 1):
        print(f"  {i}. Score: {result['score']:.3f} - {result['text'][:100]}...")
    
    print("Test completed!")
