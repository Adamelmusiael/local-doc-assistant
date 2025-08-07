from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from src.db.database import get_session
from src.db.models import Document, FileProcessingTask, ProcessingStatus
from sqlmodel import select
from pathlib import Path
from src.vectorstore.qdrant_indexer import index_chunks
from src.file_ingestion.preprocessor import preprocess_document_to_chunks
from sqlalchemy import func
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from datetime import datetime
import os
import asyncio

router = APIRouter()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "upload_files"))
UPLOAD_DIR.mkdir(exist_ok=True)

def format_file_size(size_bytes: Optional[int]) -> str:
    """
    Format file size in bytes to human-readable format.
    """
    if size_bytes is None:
        return "Unknown"
    
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes = size_bytes / 1024.0
        i += 1
    
    if i == 0:
        return f"{int(size_bytes)} {size_names[i]}"
    else:
        return f"{size_bytes:.1f} {size_names[i]}"

def get_file_size(file_path: str) -> Optional[int]:
    """
    Get file size in bytes. Returns None if file doesn't exist.
    """
    try:
        if os.path.exists(file_path):
            return os.path.getsize(file_path)
    except (OSError, IOError):
        pass
    return None

# Request Models
class PreprocessRequest(BaseModel):
    """Request model for preprocessing documents"""
    filenames: List[str] = Field(..., description="List of filenames to preprocess")

# Response Models
class DocumentMetadata(BaseModel):
    """Response model for document metadata"""
    confidentiality: str
    department: Optional[str]
    client: Optional[str]

class UploadResponse(BaseModel):
    """Response model for file upload"""
    message: str
    document_id: int
    filename: str
    saved_as: str
    file_path: str
    file_size_bytes: int
    file_size_formatted: str
    metadata: DocumentMetadata
    upload_time: str
    database_status: str

class DocumentResponse(BaseModel):
    """Response model for document data"""
    id: int
    filename: str
    confidentiality: str
    department: Optional[str]
    client: Optional[str]
    file_path: str
    file_size: Optional[int]  # file size in bytes
    file_size_formatted: Optional[str]  # human-readable file size
    created_at: Optional[str]
    processed: bool

class DocumentDetailResponse(BaseModel):
    """Response model for detailed document data"""
    id: int
    filename: str
    confidentiality: str
    department: Optional[str]
    client: Optional[str]
    file_path: str
    file_exists: bool
    file_size: Optional[int]  # file size in bytes
    file_size_formatted: Optional[str]  # human-readable file size
    created_at: Optional[str]
    processed: bool

class DocumentsListResponse(BaseModel):
    """Response model for listing documents"""
    message: str
    total_documents: int
    documents: List[DocumentResponse]

class StatsResponse(BaseModel):
    """Response model for document statistics"""
    message: str
    database_status: str
    statistics: Dict[str, int]

class DeleteDocumentResponse(BaseModel):
    """Response model for document deletion"""
    message: str
    document_id: int
    filename: str
    file_deleted: bool
    database_record_deleted: bool

class PreprocessResponse(BaseModel):
    """Response model for preprocessing results"""
    preprocessed: List[Dict[str, Any]]

class DeleteChunksResponse(BaseModel):
    """Response model for chunk deletion"""
    message: str


# Progress tracking response models
class FileProcessingProgress(BaseModel):
    """Response model for file processing progress"""
    task_id: int
    document_id: int
    status: str
    current_step: Optional[str]
    progress_percentage: float
    error_message: Optional[str]
    started_at: str
    updated_at: str
    completed_at: Optional[str]
    
    # Step-specific progress
    upload_progress: float
    extraction_progress: float
    chunking_progress: float
    vectorization_progress: float


class ProcessingStatusResponse(BaseModel):
    """Response model for processing status check"""
    success: bool
    data: Optional[FileProcessingProgress] = None
    message: str


@router.post("/upload_file", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(..., description="PDF file to upload"),
    confidentiality: str = Form(..., description="Confidentiality level of the document"),
    department: Optional[str] = Form(None, description="Department associated with the document"),
    client: Optional[str] = Form(None, description="Client associated with the document")
):
    """
    Upload a PDF file with metadata.
    
    Accepts a PDF file along with metadata (confidentiality, department, client) 
    and stores both the file and metadata in the database.
    """
    
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed [currently]")
    
    # Validate file size
    if file.size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    base_name = Path(file.filename).stem
    candidate_name = f"{base_name}{file_extension}"
    counter = 1
    while (UPLOAD_DIR / candidate_name).exists():
        candidate_name = f"{base_name}({counter}){file_extension}"
        counter += 1
    unique_filename = candidate_name
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Save metadata to database
        with get_session() as session:
            document = Document(
                filename=file.filename,
                confidentiality=confidentiality,
                department=department,
                client=client,
                pointer_to_loc=str(file_path),
                file_size=len(contents),  # Save file size in bytes
                processed=False
            )
            session.add(document)
            session.commit()
            session.refresh(document)
            
            document_id = document.id
        
        # Prepare response
        file_size_bytes = len(contents)
        
        def format_file_size(size_bytes):
            if size_bytes < 1024:
                return f"{size_bytes} B"
            elif size_bytes < 1024**2:
                return f"{size_bytes/1024:.1f} KB"
            elif size_bytes < 1024**3:
                return f"{size_bytes/(1024**2):.1f} MB"
            else:
                return f"{size_bytes/(1024**3):.1f} GB"
        
        return UploadResponse(
            message="File uploaded successfully and metadata saved to database",
            document_id=document_id,
            filename=file.filename,
            saved_as=unique_filename,
            file_path=str(file_path),
            file_size_bytes=file_size_bytes,
            file_size_formatted=format_file_size(file_size_bytes),
            metadata=DocumentMetadata(
                confidentiality=confidentiality,
                department=department,
                client=client
            ),
            upload_time=datetime.utcnow().isoformat(),
            database_status="saved"
        )
        
    except Exception as e:
        # Cleanup on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error saving file or metadata: {str(e)}")


@router.get("/list_documents", response_model=DocumentsListResponse)
async def list_documents():
    """
    List all documents with metadata from database.
    
    Returns a list of all uploaded documents with their metadata, 
    processing status, and file information including size.
    """
    try:
        with get_session() as session:
            statement = select(Document)
            documents = session.exec(statement).all()
            
            documents_list = []
            for doc in documents:
                # Get file size from database or from filesystem
                file_size = doc.file_size
                if file_size is None and doc.pointer_to_loc:
                    file_size = get_file_size(doc.pointer_to_loc)
                
                documents_list.append(DocumentResponse(
                    id=doc.id,
                    filename=doc.filename,
                    confidentiality=doc.confidentiality,
                    department=doc.department,
                    client=doc.client,
                    file_path=doc.pointer_to_loc,
                    file_size=file_size,
                    file_size_formatted=format_file_size(file_size),
                    created_at=doc.created_at.isoformat() if doc.created_at else None,
                    processed=doc.processed
                ))
            
            return DocumentsListResponse(
                message="Documents retrieved successfully",
                total_documents=len(documents_list),
                documents=documents_list
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get statistics about documents in the database.
    
    Provides database connection status and document counts (total and processed).
    """
    try:
        with get_session() as session:
            # Test database connection
            try:
                session.exec(select(Document).limit(1)).first()
                db_connection_status = "connected"
            except Exception as db_error:
                raise HTTPException(
                    status_code=503, 
                    detail=f"Database connection failed: {str(db_error)}"
                )
            
            # Get document counts
            total_count = len(session.exec(select(Document)).all())
            processed_count = len(session.exec(select(Document).where(Document.processed == True)).all())

            return StatsResponse(
                message="Statistics retrieved successfully",
                database_status=db_connection_status,
                statistics={
                    "total_documents": total_count,
                    "processed_documents": processed_count,
                }
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving statistics: {str(e)}")

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(document_id: int):
    """
    Get specific document metadata by ID.
    
    Returns detailed information about a specific document including file existence check.
    """
    try:
        with get_session() as session:
            document = session.get(Document, document_id)
            
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Check if file exists
            file_exists = False
            file_size = document.file_size
            if document.pointer_to_loc:
                file_exists = Path(document.pointer_to_loc).exists()
                # If file size not in DB, get it from filesystem
                if file_size is None and file_exists:
                    file_size = get_file_size(document.pointer_to_loc)
            
            return DocumentDetailResponse(
                id=document.id,
                filename=document.filename,
                confidentiality=document.confidentiality,
                department=document.department,
                client=document.client,
                file_path=document.pointer_to_loc,
                file_exists=file_exists,
                file_size=file_size,
                file_size_formatted=format_file_size(file_size),
                created_at=document.created_at.isoformat() if document.created_at else None,
                processed=document.processed
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving document: {str(e)}")

@router.delete("/delete_all_documents_and_chunks", response_model=DeleteChunksResponse)
def delete_all_documents_and_chunks():
    """
    Delete all documents from the database and all vectors/chunks from Qdrant.
    
    Completely clears the document database and vector store.
    """
    try:
        # Delete all documents from database
        with get_session() as session:
            docs = session.exec(select(Document)).all()
            num_deleted = len(docs)
            session.exec(Document.__table__.delete())
            session.commit()
        
        # Delete all vectors from Qdrant
        client = QdrantClient(QDRANT_URL)
        client.recreate_collection(
            collection_name="documents",
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        return DeleteChunksResponse(message=f"Deleted {num_deleted} documents and all chunks from Qdrant.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting all documents and chunks: {str(e)}")


@router.delete("/{document_id}", response_model=DeleteDocumentResponse)
async def delete_document(document_id: int):
    """
    Delete specific document by ID (file, database record, processing tasks, and chunks).
    
    Removes the document file from storage, deletes the database record,
    removes all associated processing tasks, and removes all chunks/vectors from Qdrant.
    """
    try:
        with get_session() as session:
            document = session.get(Document, document_id)
            
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Delete physical file if exists
            file_deleted = False
            if document.pointer_to_loc:
                file_path = Path(document.pointer_to_loc)
                if file_path.exists():
                    file_path.unlink()
                    file_deleted = True
            
            # Delete associated processing tasks
            processing_tasks = session.exec(
                select(FileProcessingTask).where(FileProcessingTask.document_id == document_id)
            ).all()
            for task in processing_tasks:
                session.delete(task)
            
            # Delete chunks/vectors from Qdrant
            chunks_deleted = False
            try:
                client = QdrantClient(QDRANT_URL)
                client.delete(
                    collection_name="documents",
                    wait=True,
                    filter={
                        "must": [
                            {"key": "document_id", "match": {"value": document_id}}
                        ]
                    }
                )
                chunks_deleted = True
                print(f"Deleted chunks for document_id={document_id} from Qdrant")
            except Exception as chunk_error:
                print(f"Warning: Failed to delete chunks for document {document_id}: {chunk_error}")
                # Continue with document deletion even if chunk deletion fails
            
            # Delete database record
            session.delete(document)
            session.commit()
            
            return DeleteDocumentResponse(
                message=f"Document deleted successfully (including {len(processing_tasks)} processing tasks{'and chunks' if chunks_deleted else ', chunks deletion failed'})",
                document_id=document_id,
                filename=document.filename,
                file_deleted=file_deleted,
                database_record_deleted=True
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@router.delete("/delete_chunks/{document_id}", response_model=DeleteChunksResponse)
def delete_chunks_by_document_id(document_id: int):
    """
    Delete all chunks/vectors in Qdrant for a given document ID.
    
    Removes only the vector embeddings for a specific document 
    while keeping the document record.
    """
    try:
        client = QdrantClient(QDRANT_URL)
        # Delete all points where payload.document_id == document_id
        client.delete(
            collection_name="documents",
            wait=True,
            filter={
                "must": [
                    {"key": "document_id", "match": {"value": document_id}}
                ]
            }
        )
        return DeleteChunksResponse(message=f"Chunks for document_id={document_id} deleted from Qdrant.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chunks: {str(e)}")

@router.post("/preprocess", response_model=PreprocessResponse)
def preprocess_documents(request: PreprocessRequest):
    """
    Preprocess selected documents and add them to Qdrant index.
    
    Processes PDF documents into chunks and indexes them in the vector database 
    for search functionality.
    """
    results = []
    try:
        for filename in request.filenames:
            file_path = UPLOAD_DIR / filename
            if not file_path.exists():
                raise HTTPException(status_code=404, detail=f"File {filename} not found")

            # Retrieve metadata from the database
            with get_session() as session:
                document = session.exec(
                    select(Document).where(func.lower(Document.pointer_to_loc).like(f"%{filename.lower()}"))
                ).first()
                if not document:
                    raise HTTPException(status_code=404, detail=f"Metadata for file {filename} not found in database")
                metadata = {
                    "document_id": document.id,
                    "filename": document.filename,
                    "file_path": document.pointer_to_loc,
                    "confidentiality": document.confidentiality,
                    "department": document.department,
                    "client": document.client
                }

                # Preprocess the document with actual metadata
                processed_chunks = preprocess_document_to_chunks(str(file_path), metadata=metadata)

                # Index the chunks
                index_chunks(processed_chunks)

                # Update document status in database
                document.processed = True
                session.add(document)
                session.commit()

                results.append({"filename": filename, "chunks_added": len(processed_chunks), "metadata": metadata})
        return PreprocessResponse(preprocessed=results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# Background task functions for file processing
async def update_processing_progress(task_id: int, step: str, progress: float, step_progress: Dict[str, float] = None):
    """Update processing progress in database"""
    with get_session() as session:
        task = session.exec(select(FileProcessingTask).where(FileProcessingTask.id == task_id)).first()
        if task:
            task.current_step = step
            task.progress_percentage = progress
            task.updated_at = datetime.utcnow()
            
            if step_progress:
                if "upload" in step_progress:
                    task.upload_progress = step_progress["upload"]
                if "extraction" in step_progress:
                    task.extraction_progress = step_progress["extraction"]
                if "chunking" in step_progress:
                    task.chunking_progress = step_progress["chunking"]
                if "vectorization" in step_progress:
                    task.vectorization_progress = step_progress["vectorization"]
            
            session.add(task)
            session.commit()


async def process_file_background(task_id: int, document_id: int, file_path: str, metadata: Dict[str, Any]):
    """Background task to process uploaded file"""
    try:
        # Update status to extracting
        await update_processing_progress(task_id, "Text Extraction", 25.0, {"extraction": 0.0})
        
        # Text extraction
        await asyncio.sleep(0.1)  # Simulate processing time
        processed_chunks = preprocess_document_to_chunks(file_path, metadata=metadata)
        await update_processing_progress(task_id, "Text Extraction", 50.0, {"extraction": 100.0})
        
        # Update status to chunking
        await update_processing_progress(task_id, "Chunking", 60.0, {"chunking": 0.0})
        await asyncio.sleep(0.1)
        await update_processing_progress(task_id, "Chunking", 75.0, {"chunking": 100.0})
        
        # Update status to vectorizing
        await update_processing_progress(task_id, "Vectorization", 80.0, {"vectorization": 0.0})
        
        # Index the chunks
        index_chunks(processed_chunks)
        await update_processing_progress(task_id, "Vectorization", 95.0, {"vectorization": 100.0})
        
        # Complete processing
        with get_session() as session:
            # Update document status
            document = session.exec(select(Document).where(Document.id == document_id)).first()
            if document:
                document.processed = True
                session.add(document)
            
            # Update task status
            task = session.exec(select(FileProcessingTask).where(FileProcessingTask.id == task_id)).first()
            if task:
                task.status = ProcessingStatus.COMPLETED
                task.current_step = "Completed"
                task.progress_percentage = 100.0
                task.completed_at = datetime.utcnow()
                task.updated_at = datetime.utcnow()
                session.add(task)
            
            session.commit()
            
    except Exception as e:
        # Update task with error status
        with get_session() as session:
            task = session.exec(select(FileProcessingTask).where(FileProcessingTask.id == task_id)).first()
            if task:
                task.status = ProcessingStatus.FAILED
                task.error_message = str(e)
                task.updated_at = datetime.utcnow()
                session.add(task)
                session.commit()


@router.post("/upload_file_async", response_model=Dict[str, Any])
async def upload_file_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF file to upload"),
    confidentiality: str = Form(..., description="Confidentiality level of the document"),
    department: Optional[str] = Form(None, description="Department associated with the document"),
    client: Optional[str] = Form(None, description="Client associated with the document")
):
    """
    Upload a PDF file with background processing and progress tracking.
    
    Returns immediately with a task ID that can be used to track processing progress.
    """
    
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Validate file size
    if file.size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        base_name = Path(file.filename).stem
        candidate_name = f"{base_name}{file_extension}"
        counter = 1
        while (UPLOAD_DIR / candidate_name).exists():
            candidate_name = f"{base_name}({counter}){file_extension}"
            counter += 1
        unique_filename = candidate_name
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Save metadata to database
        with get_session() as session:
            document = Document(
                filename=file.filename,
                confidentiality=confidentiality,
                department=department,
                client=client,
                pointer_to_loc=str(file_path),
                file_size=len(contents),  # Save file size in bytes
                processed=False
            )
            session.add(document)
            session.commit()
            session.refresh(document)
            
            # Create processing task
            task = FileProcessingTask(
                document_id=document.id,
                status=ProcessingStatus.UPLOADING,
                current_step="File Upload",
                upload_progress=100.0
            )
            session.add(task)
            session.commit()
            session.refresh(task)
            
            # Start background processing
            metadata = {
                "document_id": document.id,
                "filename": file.filename,
                "confidentiality": confidentiality,
                "department": department,
                "client": client
            }
            
            background_tasks.add_task(
                process_file_background,
                task.id,
                document.id,
                str(file_path),
                metadata
            )
            
            return {
                "message": "File uploaded successfully, processing started",
                "document_id": document.id,
                "task_id": task.id,
                "filename": file.filename,
                "status": "processing",
                "progress_endpoint": f"/docs/processing/{task.id}/status"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@router.get("/processing/{task_id}/status", response_model=ProcessingStatusResponse)
async def get_processing_status(task_id: int):
    """
    Get the current processing status of a file upload task.
    
    Returns detailed progress information including current step and percentages.
    """
    try:
        with get_session() as session:
            task = session.exec(select(FileProcessingTask).where(FileProcessingTask.id == task_id)).first()
            
            if not task:
                return ProcessingStatusResponse(
                    success=False,
                    message=f"Task {task_id} not found"
                )
            
            progress_data = FileProcessingProgress(
                task_id=task.id,
                document_id=task.document_id,
                status=task.status.value,
                current_step=task.current_step,
                progress_percentage=task.progress_percentage,
                error_message=task.error_message,
                started_at=task.started_at.isoformat(),
                updated_at=task.updated_at.isoformat(),
                completed_at=task.completed_at.isoformat() if task.completed_at else None,
                upload_progress=task.upload_progress,
                extraction_progress=task.extraction_progress,
                chunking_progress=task.chunking_progress,
                vectorization_progress=task.vectorization_progress
            )
            
            return ProcessingStatusResponse(
                success=True,
                data=progress_data,
                message="Status retrieved successfully"
            )
            
    except Exception as e:
        return ProcessingStatusResponse(
            success=False,
            message=f"Error retrieving status: {str(e)}"
        )


@router.get("/processing/active")
async def get_active_processing_tasks():
    """
    Get all currently active processing tasks.
    
    Returns list of tasks that are currently being processed.
    """
    try:
        with get_session() as session:
            statement = select(FileProcessingTask).where(
                FileProcessingTask.status.in_([
                    ProcessingStatus.PENDING,
                    ProcessingStatus.UPLOADING,
                    ProcessingStatus.EXTRACTING,
                    ProcessingStatus.CHUNKING,
                    ProcessingStatus.VECTORIZING
                ])
            )
            active_tasks = session.exec(statement).all()
            
            tasks_data = []
            for task in active_tasks:
                tasks_data.append({
                    "task_id": task.id,
                    "document_id": task.document_id,
                    "status": task.status.value,
                    "current_step": task.current_step,
                    "progress_percentage": task.progress_percentage,
                    "started_at": task.started_at.isoformat(),
                    "updated_at": task.updated_at.isoformat()
                })
            
            return {
                "message": "Active tasks retrieved successfully",
                "total_active_tasks": len(tasks_data),
                "tasks": tasks_data
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving active tasks: {str(e)}")