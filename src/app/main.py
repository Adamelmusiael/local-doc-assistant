from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import documents, chat
from src.db.init_db import init_db 
from src.vectorstore.qdrant_indexer import ensure_collection_with_retry
import os
from qdrant_client import QdrantClient

app = FastAPI(title="AI Assistant")

# CORS Configuration
# Get allowed origins from environment variable, default to common development origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Frontend origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Cache-Control"
    ],
    expose_headers=["Content-Range", "X-Content-Range"],
    max_age=600,  # Cache preflight requests for 10 minutes
)


@app.on_event("startup")
def on_startup():
    init_db()
    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    client = QdrantClient(QDRANT_URL)
    ensure_collection_with_retry()  # Create collection if it does not exist retry connection


@app.get("/")
def root():
    """Root endpoint for health checks and API verification"""
    return {"message": "AI Assistant API is running", "status": "healthy"}


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and CORS testing"""
    return {"status": "healthy", "service": "AI Assistant API"}


app.include_router(documents.router, prefix="/docs", tags=["Documents"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])