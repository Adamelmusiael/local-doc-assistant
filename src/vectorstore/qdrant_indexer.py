import os
import time
import uuid
from typing import List

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
from qdrant_client.http.exceptions import ResponseHandlingException, UnexpectedResponse

from .embedder import embed_text
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
client = QdrantClient(QDRANT_URL)


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
    try:
        client.get_collection(collection_name)
        print(f"Qdrant collection '{collection_name}' already exists.")
    except Exception as e:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        print(f"Qdrant collection '{collection_name}' has been created.")


def ensure_collection_with_retry(max_retries=10, delay=3):
    for attempt in range(max_retries):
        try:
            ensure_collection() 
            print("Qdrant is ready!")
            return
        except ResponseHandlingException as e:
            print(f"Qdrant not ready, retrying in {delay}s... ({attempt+1}/{max_retries})")
            time.sleep(delay)
    raise Exception("Qdrant did not become ready in time.")