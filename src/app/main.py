from fastapi import FastAPI
from .api import upload, documents, chat
from src.db.init_db import init_db 
from src.vectorstore.qdrant_indexer import ensure_collection

app = FastAPI(title="AI Assistant")


@app.on_event("startup")
def on_startup():
    init_db()
    ensure_collection()  # Create collection if it does not exist

app.include_router(upload.router, prefix="/upload", tags=["Upload"])
app.include_router(documents.router, prefix="/docs", tags=["Documents"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])