# Architecture & Structure

## Overview
- **Backend:** FastAPI (Python)
- **Vector Search:** Qdrant
- **Database:** SQLite (for metadata)


## Main Directories
- `src/app/api/` – API endpoints (chat, documents)
- `src/chat_logic/` – Chat logic, session/message handling
- `src/db/` – Database models and connection
- `src/file_ingestion/` – PDF extraction, chunking, preprocessing
- `src/vectorstore/` – Embedding, Qdrant indexing/search

## Data Flow
1. User uploads PDF → `/docs/upload_file`
2. Preprocess splits & indexes text → Qdrant
3. User chats → `/chat/{session_id}/message` uses LLM with document context 