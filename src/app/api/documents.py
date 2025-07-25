from fastapi import APIRouter, HTTPException, UploadFile, File, Form, HTTPException
from src.db.database import get_session
from src.db.models import Document
from sqlmodel import select
from pathlib import Path
from pydantic import BaseModel
from src.vectorstore.qdrant_indexer import index_chunks
from src.file_ingestion.preprocessor import preprocess_document_to_chunks
from sqlalchemy import func
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from datetime import datetime
from typing import Optional
import os

router = APIRouter()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "upload_files"))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "upload_files"))
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload_file")
async def upload_file(
    file: UploadFile = File(...),
    #filename: Optional[str] = Form(None),
    confidentiality: str = Form(...),
    department: Optional[str] = Form(None),
    client: Optional[str] = Form(None)
):
    """Upload a PDF file with metadata"""
    
    # is PDF?
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed [currently]")
    
    # is empty? ! Warning: may cause errror if file.size is not available !!! DO TESTOWANIA 
    if file.size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Randomize filename - for unique path
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
        # Save file (local)
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
        
        # Prepare response with metadata
        file_size_bytes = len(contents)
        
        # Helper function to format file size
        def format_file_size(size_bytes):
            if size_bytes < 1024:
                return f"{size_bytes} B"
            elif size_bytes < 1024**2:
                return f"{size_bytes/1024:.1f} KB"
            elif size_bytes < 1024**3:
                return f"{size_bytes/(1024**2):.1f} MB"
            else:
                return f"{size_bytes/(1024**3):.1f} GB"
        
        response = {
            "message": "File uploaded successfully and metadata saved to database",
            "document_id": document_id,
            "filename": file.filename,
            "saved_as": unique_filename,
            "file_path": str(file_path),
            "file_size_bytes": file_size_bytes,
            "file_size_formatted": format_file_size(file_size_bytes),
            "metadata": {
                "confidentiality": confidentiality,
                "department": department,
                "client": client
            },
            "upload_time": datetime.utcnow().isoformat(),
            "database_status": "saved"
        }
        
        return response
        
    except Exception as e:
        # Delete file if error occurs
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error saving file or metadata: {str(e)}")


@router.get("/list_documents")
async def list_documents():
    """List all documents with metadata from database"""
    try:
        with get_session() as session:
            statement = select(Document)
            documents = session.exec(statement).all()
            
            documents_list = []
            for doc in documents:
                documents_list.append({
                    "id": doc.id,
                    "filename": doc.filename,
                    "confidentiality": doc.confidentiality,
                    "department": doc.department,
                    "client": doc.client,
                    "file_path": doc.pointer_to_loc,
                    "created_at": doc.created_at.isoformat() if doc.created_at else None,
                    "processed": doc.processed
                })
            
            return {
                "message": "Documents retrieved successfully",
                "total_documents": len(documents_list),
                "documents": documents_list
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

@router.get("/stats")
async def get_stats():
    """Get statistics about documents in the database"""
    try:
        with get_session() as session:
            # Test database connection
            try:
                # Simple query to test connection
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

            return {
                "message": "Statistics retrieved successfully",
                "database_status": db_connection_status,
                "statistics": {
                    "total_documents": total_count,
                    "processed_documents": processed_count,  
                    # Add new statistics in future
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving statistics: {str(e)}")

@router.get("/{document_id}")
async def get_document(document_id: int):
    """Get specific document metadata by ID"""
    try:
        with get_session() as session:
            document = session.get(Document, document_id)
            
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Check if file exists
            file_exists = False
            if document.pointer_to_loc:
                file_exists = Path(document.pointer_to_loc).exists()
            
            return {
                "id": document.id,
                "filename": document.filename,
                "confidentiality": document.confidentiality,
                "department": document.department,
                "client": document.client,
                "file_path": document.pointer_to_loc,
                "file_exists": file_exists,
                "created_at": document.created_at.isoformat() if document.created_at else None,
                "processed": document.processed
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving document: {str(e)}")

@router.delete("/delete_all_documents_and_chunks")
def delete_all_documents_and_chunks():
    """Delete all documents from the database and all vectors/chunks from Qdrant."""
    try:
        # Usuń wszystkie dokumenty z bazy
        with get_session() as session:
            docs = session.exec(select(Document)).all()
            num_deleted = len(docs)
            session.exec(Document.__table__.delete())
            session.commit()
        # Usuń wszystkie wektory z Qdrant
        client = QdrantClient(QDRANT_URL)
        client.recreate_collection(
            collection_name="documents",
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        return {"message": f"Deleted {num_deleted} documents and all chunks from Qdrant."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting all documents and chunks: {str(e)}")


@router.delete("/{document_id}")
async def delete_document(document_id: int):
    """Delete specific document by ID (both file and database record)"""
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
            
            return {
                "message": "Document deleted successfully",
                "document_id": document_id,
                "filename": document.filename,
                "file_deleted": file_deleted,
                "database_record_deleted": True
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@router.delete("/delete_chunks/{document_id}")
def delete_chunks_by_document_id(document_id: int):
    """Delete all chunks/vectors in Qdrant for a given document_id."""
    try:
        client = QdrantClient(QDRANT_URL)
        # Usuwamy wszystkie punkty, gdzie payload.document_id == document_id
        client.delete(
            collection_name="documents",
            wait=True,
            filter={
                "must": [
                    {"key": "document_id", "match": {"value": document_id}}
                ]
            }
        )
        return {"message": f"Chunks for document_id={document_id} deleted from Qdrant."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chunks: {str(e)}")

class PreprocessRequest(BaseModel):
    filenames: list[str]

@router.post("/preprocess")
def preprocess_documents(request: PreprocessRequest):
    """Preprocess selected documents and add them to Qdrant index."""
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
        return {"preprocessed": results}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")