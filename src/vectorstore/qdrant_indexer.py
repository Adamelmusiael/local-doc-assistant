from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from .embedder import embed_text
from typing import List
import uuid

client = QdrantClient("http://localhost:6333")

def setup_collection(collection_name: str = "documents"):
    """Setup Qdrant collection with necessary parameters. 
    If collection exists, deletes it, then creates a new one."""
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=1024, distance=Distance.COSINE) 
    )

def index_chunks(chunks: List[dict], collection_name: str = "documents"):
    """
    Index a list of document chunks into Qdrant vector database.
    Args:
        chunks (List[dict]): List of chunk dictionaries, each containing:
                           - 'text': text content to be indexed
                           - metadata fields (e.g., filename, document_id, chunk_index)
        collection_name (str): Name of the Qdrant collection (default: "documents")
    Result:
        Chunks become semantically searchable in Qdrant vector database.
    """
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embed_text(chunk['text']),
            payload=chunk
        )
        for chunk in chunks
    ]
    client.upsert(collection_name=collection_name, points=points)
    print(f"Sentences indexed: {len(points)} to Qdrant collection '{collection_name}'")

def ensure_collection(collection_name: str = "documents"):
    """Create Qdrant collection if it does not exist."""
    from qdrant_client.http.exceptions import UnexpectedResponse
    try:
        # Check if collection exists
        client.get_collection(collection_name)
        print(f"Qdrant collection '{collection_name}' already exists.")
    except Exception as e:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        print(f"Qdrant collection '{collection_name}' has been created.")