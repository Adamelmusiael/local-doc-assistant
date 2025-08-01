# Enhanced Chat API and File Upload Progress Tracking

## Overview

This document describes the implementation of enhanced chat API endpoints with WebSocket support and comprehensive file upload progress tracking system.

## 1. Enhanced Chat API Endpoints

### 1.1 Structured Error Handling

#### New Response Models
```python
class ErrorDetail(BaseModel):
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str

class EnhancedResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[ErrorDetail] = None
    metadata: Optional[Dict[str, Any]] = None
```

**Benefits:**
- ✅ Consistent error format across all endpoints
- ✅ Detailed error information with codes and timestamps
- ✅ Structured success/failure responses
- ✅ Additional metadata support

### 1.2 WebSocket Support

#### New WebSocket Endpoint
- **URL**: `ws://localhost:8000/chat/{session_id}/ws`
- **Purpose**: Bidirectional real-time communication
- **Features**: Message streaming, typing indicators, live status

#### WebSocket Message Types
```json
// Typing indicator
{
  "type": "typing",
  "user_id": "user123",
  "is_typing": true
}

// Chat message
{
  "type": "chat_message",
  "question": "Hello",
  "model": "mistral",
  "search_mode": "all"
}

// Server responses
{
  "type": "typing_update",
  "session_id": 1,
  "user_id": "user123",
  "is_typing": true,
  "timestamp": "2025-01-01T12:00:00"
}
```

#### Connection Manager
```python
class ConnectionManager:
    - connect(websocket, session_id)
    - disconnect(websocket, session_id) 
    - send_personal_message(message, websocket)
    - broadcast_to_session(message, session_id)
```

**Benefits:**
- ✅ Real-time bidirectional communication
- ✅ Multiple clients per session support
- ✅ Automatic connection cleanup
- ✅ Broadcast messaging within sessions

### 1.3 Typing Indicators

#### New Endpoints
```python
POST /chat/{session_id}/typing
GET /chat/{session_id}/typing
```

#### Database Model
```python
class TypingIndicator(SQLModel, table=True):
    id: Optional[int]
    session_id: int
    user_id: Optional[str]
    is_typing: bool
    last_updated: datetime
```

**Features:**
- ✅ Real-time typing status updates
- ✅ Multiple users per session
- ✅ WebSocket broadcasting
- ✅ Persistent storage

## 2. File Upload Progress Tracking

### 2.1 New Database Models

#### FileProcessingTask
```python
class FileProcessingTask(SQLModel, table=True):
    id: Optional[int]
    document_id: int
    status: ProcessingStatus
    current_step: Optional[str]
    progress_percentage: float
    error_message: Optional[str]
    started_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    # Step-specific progress
    upload_progress: float
    extraction_progress: float
    chunking_progress: float
    vectorization_progress: float
```

#### ProcessingStatus Enum
```python
class ProcessingStatus(str, Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    VECTORIZING = "vectorizing"
    COMPLETED = "completed"
    FAILED = "failed"
```

### 2.2 Background Processing System

#### New Upload Endpoint
```python
POST /docs/upload_file_async
```
- Returns immediately with task ID
- Starts background processing
- Provides progress tracking endpoint

#### Progress Tracking Endpoint
```python
GET /docs/processing/{task_id}/status
```

#### Active Tasks Endpoint
```python
GET /docs/processing/active
```

### 2.3 Processing Pipeline

#### Stage 1: File Upload (0-25%)
- File validation
- Save to disk
- Create database records
- Initialize processing task

#### Stage 2: Text Extraction (25-50%)
- Extract text from PDF
- Handle extraction errors
- Update progress in real-time

#### Stage 3: Text Chunking (50-75%)
- Split text into semantic chunks
- Apply overlap and size constraints
- Prepare for vectorization

#### Stage 4: Vectorization (75-100%)
- Generate embeddings
- Index in Qdrant vector database
- Mark document as processed
- Complete task

### 2.4 Error Handling

#### Comprehensive Error Tracking
- Error messages stored in database
- Task status updated to FAILED
- Detailed error information in API responses
- Graceful degradation

#### Recovery Mechanisms
- Failed tasks can be retried
- Partial progress preserved
- Clear error reporting to users

## 3. Implementation Details

### 3.1 Background Tasks
```python
async def process_file_background(task_id, document_id, file_path, metadata):
    # Multi-stage processing with progress updates
    await update_processing_progress(task_id, "Text Extraction", 25.0)
    # ... processing steps
    await update_processing_progress(task_id, "Completed", 100.0)
```

### 3.2 Progress Updates
```python
async def update_processing_progress(task_id, step, progress, step_progress=None):
    # Real-time database updates
    # Step-specific progress tracking
    # Timestamp management
```

### 3.3 WebSocket Integration
```python
@router.websocket("/{session_id}/ws")
async def websocket_endpoint(websocket, session_id):
    # Handle typing indicators
    # Stream chat responses
    # Broadcast updates
    # Manage connections
```

## 4. API Usage Examples

### 4.1 WebSocket Chat
```javascript
const ws = new WebSocket('ws://localhost:8000/chat/1/ws');

// Send typing indicator
ws.send(JSON.stringify({
  type: 'typing',
  user_id: 'user123',
  is_typing: true
}));

// Send chat message
ws.send(JSON.stringify({
  type: 'chat_message',
  question: 'Hello',
  model: 'mistral'
}));

// Handle responses
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chunk') {
    appendToMessage(data.content);
  }
};
```

### 4.2 File Upload with Progress
```javascript
// Upload file
const response = await fetch('/docs/upload_file_async', {
  method: 'POST',
  body: formData
});
const result = await response.json();

// Track progress
const trackProgress = setInterval(async () => {
  const progress = await fetch(`/docs/processing/${result.task_id}/status`);
  const status = await progress.json();
  
  updateProgressBar(status.data.progress_percentage);
  
  if (status.data.status === 'completed') {
    clearInterval(trackProgress);
    showSuccess();
  }
}, 1000);
```

### 4.3 Typing Indicators
```javascript
// Update typing status
await fetch(`/chat/${sessionId}/typing`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    is_typing: true,
    user_id: 'user123'
  })
});

// Get current typing users
const response = await fetch(`/chat/${sessionId}/typing`);
const typingUsers = await response.json();
```

## 5. Benefits and Improvements

### 5.1 User Experience
- ✅ **Real-time feedback**: Users see progress immediately
- ✅ **Interactive chat**: Typing indicators and live responses  
- ✅ **Error transparency**: Clear error messages and recovery options
- ✅ **Non-blocking uploads**: Users can continue working while files process

### 5.2 Technical Benefits
- ✅ **Scalable processing**: Background tasks don't block API
- ✅ **Persistent progress**: Progress survives server restarts
- ✅ **Real-time communication**: WebSocket support for modern UX
- ✅ **Comprehensive tracking**: Detailed progress and error information

### 5.3 Developer Experience
- ✅ **Structured responses**: Consistent API response format
- ✅ **Detailed logging**: Complete audit trail of processing
- ✅ **Flexible integration**: Multiple communication methods (REST, SSE, WebSocket)
- ✅ **Error handling**: Comprehensive error management system

## 6. Monitoring and Debugging

### 6.1 Active Task Monitoring
```bash
curl http://localhost:8000/docs/processing/active
```

### 6.2 Individual Task Status
```bash
curl http://localhost:8000/docs/processing/123/status
```

### 6.3 WebSocket Connection Testing
```javascript
// Browser console test
const ws = new WebSocket('ws://localhost:8000/chat/1/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
```

This implementation provides a robust foundation for real-time file processing and interactive chat functionality, bringing the AI Assistant to production-ready standards.
