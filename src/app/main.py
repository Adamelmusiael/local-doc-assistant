from fastapi import FastAPI
from .api import documents, chat
from src.db.init_db import init_db 
from src.vectorstore.qdrant_indexer import ensure_collection_with_retry
import os
from qdrant_client import QdrantClient

app = FastAPI(title="AI Assistant")


@app.on_event("startup")
def on_startup():
    init_db()
    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    client = QdrantClient(QDRANT_URL)
    ensure_collection_with_retry()  # Create collection if it does not exist retry connection


app.include_router(documents.router, prefix="/docs", tags=["Documents"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])