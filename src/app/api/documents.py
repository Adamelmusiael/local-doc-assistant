from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from src.db.database import get_session
from src.db.models import Document
from sqlmodel import select
from pathlib import Path
from src.vectorstore.qdrant_indexer import index_chunks
from src.file_ingestion.preprocessor import preprocess_document_to_chunks
from sqlalchemy import func
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from datetime import datetime
import os

router = APIRouter()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "upload_files"))
UPLOAD_DIR.mkdir(exist_ok=True)

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
    processing status, and file information.
    """
    try:
        with get_session() as session:
            statement = select(Document)
            documents = session.exec(statement).all()
            
            documents_list = []
            for doc in documents:
                documents_list.append(DocumentResponse(
                    id=doc.id,
                    filename=doc.filename,
                    confidentiality=doc.confidentiality,
                    department=doc.department,
                    client=doc.client,
                    file_path=doc.pointer_to_loc,
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
            if document.pointer_to_loc:
                file_exists = Path(document.pointer_to_loc).exists()
            
            return DocumentDetailResponse(
                id=document.id,
                filename=document.filename,
                confidentiality=document.confidentiality,
                department=document.department,
                client=document.client,
                file_path=document.pointer_to_loc,
                file_exists=file_exists,
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
    Delete specific document by ID (both file and database record).
    
    Removes the document file from storage and deletes the database record.
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
            
            # Delete database record
            session.delete(document)
            session.commit()
            
            return DeleteDocumentResponse(
                message="Document deleted successfully",
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