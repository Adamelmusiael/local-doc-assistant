# AI Assistant API Documentation

## Overview
This API provides endpoints for document management, chat functionality, and AI-powered document search and conversation.

## Base URL
```
http://localhost:8000
```

---

## Documents Endpoints

### 1. Upload File
**POST** `/docs/upload_file`

Uploads a PDF file with metadata to the system.

**Description:** Accepts a PDF file along with metadata (confidentiality, department, client) and stores both the file and metadata in the database.

**Parameters:**
- `file` (file, required): PDF file to upload
- `confidentiality` (string, required): Confidentiality level of the document
- `department` (string, optional): Department associated with the document
- `client` (string, optional): Client associated with the document

**Returns:**
```json
{
  "message": "File uploaded successfully and metadata saved to database",
  "document_id": 1,
  "filename": "document.pdf",
  "saved_as": "document.pdf",
  "file_path": "/path/to/file",
  "file_size_bytes": 1024000,
  "file_size_formatted": "1000.0 KB",
  "metadata": {
    "confidentiality": "public",
    "department": "IT",
    "client": "Company ABC"
  },
  "upload_time": "2024-01-15T10:30:00",
  "database_status": "saved"
}
```

**Example Usage:**
```bash
curl -X POST "http://localhost:8000/docs/upload_file" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf" \
  -F "confidentiality=public" \
  -F "department=IT" \
  -F "client=Company ABC"
```

---

### 2. List Documents
**GET** `/docs/list_documents`

Retrieves all documents with their metadata from the database.

**Description:** Returns a list of all uploaded documents with their metadata, processing status, and file information.

**Parameters:** None

**Returns:**
```json
{
  "message": "Documents retrieved successfully",
  "total_documents": 5,
  "documents": [
    {
      "id": 1,
      "filename": "document.pdf",
      "confidentiality": "public",
      "department": "IT",
      "client": "Company ABC",
      "file_path": "/path/to/file",
      "created_at": "2024-01-15T10:30:00",
      "processed": true
    }
  ]
}
```

**Example Usage:**
```bash
curl -X GET "http://localhost:8000/docs/list_documents"
```

---

### 3. Get Document Statistics
**GET** `/docs/stats`

Retrieves statistics about documents in the database.

**Description:** Provides database connection status and document counts (total and processed).

**Parameters:** None

**Returns:**
```json
{
  "message": "Statistics retrieved successfully",
  "database_status": "connected",
  "statistics": {
    "total_documents": 10,
    "processed_documents": 8
  }
}
```

**Example Usage:**
```bash
curl -X GET "http://localhost:8000/docs/stats"
```

---

### 4. Get Document by ID
**GET** `/docs/{document_id}`

Retrieves specific document metadata by ID.

**Description:** Returns detailed information about a specific document including file existence check.

**Parameters:**
- `document_id` (integer, required): ID of the document to retrieve

**Returns:**
```json
{
  "id": 1,
  "filename": "document.pdf",
  "confidentiality": "public",
  "department": "IT",
  "client": "Company ABC",
  "file_path": "/path/to/file",
  "file_exists": true,
  "created_at": "2024-01-15T10:30:00",
  "processed": true
}
```

**Example Usage:**
```bash
curl -X GET "http://localhost:8000/docs/1"
```

---

### 5. Delete Document
**DELETE** `/docs/{document_id}`

Deletes a specific document by ID (both file and database record).

**Description:** Removes the document file from storage and deletes the database record.

**Parameters:**
- `document_id` (integer, required): ID of the document to delete

**Returns:**
```json
{
  "message": "Document deleted successfully",
  "document_id": 1,
  "filename": "document.pdf",
  "file_deleted": true,
  "database_record_deleted": true
}
```

**Example Usage:**
```bash
curl -X DELETE "http://localhost:8000/docs/1"
```

---

### 6. Delete All Documents and Chunks
**DELETE** `/docs/delete_all_documents_and_chunks`

Deletes all documents from the database and all vectors/chunks from Qdrant.

**Description:** Completely clears the document database and vector store.

**Parameters:** None

**Returns:**
```json
{
  "message": "Deleted 5 documents and all chunks from Qdrant."
}
```

**Example Usage:**
```bash
curl -X DELETE "http://localhost:8000/docs/delete_all_documents_and_chunks"
```

---

### 7. Delete Chunks by Document ID
**DELETE** `/docs/delete_chunks/{document_id}`

Deletes all chunks/vectors in Qdrant for a given document ID.

**Description:** Removes only the vector embeddings for a specific document while keeping the document record.

**Parameters:**
- `document_id` (integer, required): ID of the document whose chunks to delete

**Returns:**
```json
{
  "message": "Chunks for document_id=1 deleted from Qdrant."
}
```

**Example Usage:**
```bash
curl -X DELETE "http://localhost:8000/docs/delete_chunks/1"
```

---

### 8. Preprocess Documents
**POST** `/docs/preprocess`

Preprocesses selected documents and adds them to Qdrant index.

**Description:** Processes PDF documents into chunks and indexes them in the vector database for search functionality.

**Parameters:**
```json
{
  "filenames": ["document1.pdf", "document2.pdf"]
}
```

**Returns:**
```json
{
  "preprocessed": [
    {
      "filename": "document1.pdf",
      "chunks_added": 15,
      "metadata": {
        "document_id": 1,
        "file_path": "/path/to/file",
        "confidentiality": "public",
        "department": "IT",
        "client": "Company ABC"
      }
    }
  ]
}
```

**Example Usage:**
```bash
curl -X POST "http://localhost:8000/docs/preprocess" \
  -H "Content-Type: application/json" \
  -d '{"filenames": ["document1.pdf", "document2.pdf"]}'
```

---

## Chat Endpoints

### 1. Send Chat Message with Session
**POST** `/chat/{session_id}/message`

Sends a chat message within a specific session with metadata tracking.

**Description:** Processes a question within a chat session and returns an answer with metadata (sources, confidence, hallucination detection).

**Parameters:**
- `session_id` (integer, required): ID of the chat session
- `request` (object, required):
  ```json
  {
    "question": "What is the main topic?",
    "model": "mistral"
  }
  ```

**Returns:**
```json
{
  "answer": "Based on the documents...",
  "model": "mistral",
  "sources": [
    {
      "text": "Document excerpt...",
      "score": 0.85,
      "metadata": {
        "document_id": 1,
        "confidentiality": "public"
      }
    }
  ],
  "confidence": 0.92,
  "hallucination": false
}
```

**Example Usage:**
```bash
curl -X POST "http://localhost:8000/chat/1/message" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?", "model": "mistral"}'
```

---

### 2. List Chat Sessions
**GET** `/chat/chat_sessions`

Retrieves all chat sessions with metadata from the database.

**Description:** Returns a list of all chat sessions with their metadata and status.

**Parameters:** None

**Returns:**
```json
{
  "message": "Chat sessions retrieved successfully",
  "total_sessions": 3,
  "sessions": [
    {
      "id": 1,
      "title": "Document Analysis Session",
      "created_at": "2024-01-15T10:30:00",
      "llm_model": "mistral",
      "user_id": "user123",
      "status": "active",
      "session_metadata": "Analysis of technical documents"
    }
  ]
}
```

**Example Usage:**
```bash
curl -X GET "http://localhost:8000/chat/chat_sessions"
```

---

### 3. Get Chat Session
**GET** `/chat/chat_sessions/{session_id}`

Retrieves specific chat session metadata by ID.

**Description:** Returns detailed information about a specific chat session.

**Parameters:**
- `session_id` (integer, required): ID of the chat session

**Returns:**
```json
{
  "id": 1,
  "title": "Document Analysis Session",
  "created_at": "2024-01-15T10:30:00",
  "llm_model": "mistral",
  "user_id": "user123",
  "status": "active",
  "session_metadata": "Analysis of technical documents"
}
```

**Example Usage:**
```bash
curl -X GET "http://localhost:8000/chat/chat_sessions/1"
```

---

### 4. Create Chat Session
**POST** `/chat/chat_sessions`

Creates a new chat session and returns its metadata.

**Description:** Creates a new chat session with specified parameters and returns the session details.

**Parameters:**
```json
{
  "title": "New Analysis Session",
  "llm_model": "mistral",
  "user_id": "user123",
  "status": "active",
  "session_metadata": "Analysis session for technical documents"
}
```

**Returns:**
```json
{
  "id": 2,
  "title": "New Analysis Session",
  "created_at": "2024-01-15T11:00:00",
  "llm_model": "mistral",
  "user_id": "user123",
  "status": "active",
  "session_metadata": "Analysis session for technical documents"
}
```

**Example Usage:**
```bash
curl -X POST "http://localhost:8000/chat/chat_sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Analysis Session",
    "llm_model": "mistral",
    "user_id": "user123",
    "status": "active",
    "session_metadata": "Analysis session for technical documents"
  }'
```

---

### 5. Delete Chat Session
**DELETE** `/chat/chat_sessions/{session_id}`

Deletes a chat session by ID (and its messages).

**Description:** Removes the chat session and all associated messages from the database.

**Parameters:**
- `session_id` (integer, required): ID of the chat session to delete

**Returns:**
```json
{
  "message": "Chat session and its messages deleted successfully",
  "session_id": 1
}
```

**Example Usage:**
```bash
curl -X DELETE "http://localhost:8000/chat/chat_sessions/1"
```

---

### 6. Get Chat Messages
**GET** `/chat/{session_id}/messages`

Retrieves all messages for a given chat session.

**Description:** Returns all messages in a chat session with their metadata (sources, confidence, hallucination detection).

**Parameters:**
- `session_id` (integer, required): ID of the chat session

**Returns:**
```json
{
  "message": "Messages retrieved successfully",
  "total_messages": 5,
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What is the main topic?",
      "timestamp": "2024-01-15T10:30:00",
      "sources": null,
      "confidence": null,
      "hallucination": null
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Based on the documents...",
      "timestamp": "2024-01-15T10:30:05",
      "sources": [
        {
          "text": "Document excerpt...",
          "score": 0.85
        }
      ],
      "confidence": 0.92,
      "hallucination": false
    }
  ]
}
```

**Example Usage:**
```bash
curl -X GET "http://localhost:8000/chat/1/messages"
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Only PDF files are allowed [currently]"
}
```

### 404 Not Found
```json
{
  "detail": "Document not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error processing request: [error message]"
}
```

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Rate Limiting

No rate limiting is currently implemented.

---

## Notes for Frontend Development

1. **File Upload**: Use `multipart/form-data` for file uploads
2. **Session Management**: Create sessions before sending messages for better tracking
3. **Error Handling**: Always check for error responses in the `detail` field
4. **File Types**: Currently only PDF files are supported
5. **Vector Search**: Documents must be preprocessed before they can be searched
6. **Model Selection**: Default model is "mistral", but can be overridden per request 