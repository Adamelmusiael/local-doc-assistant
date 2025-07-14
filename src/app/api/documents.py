from fastapi import APIRouter, HTTPException
from src.db.database import get_session
from src.db.models import Document
from sqlmodel import select
from pathlib import Path

router = APIRouter()

@router.get("/")
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