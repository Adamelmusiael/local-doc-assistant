from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_documents():
    """List all documents"""
    return {"message": "Documents list endpoint - not implemented yet"}

@router.get("/{document_id}")
async def get_document(document_id: int):
    """Get specific document by ID"""
    return {"message": f"Get document {document_id} - not implemented yet"}

@router.delete("/{document_id}")
async def delete_document(document_id: int):
    """Delete specific document by ID"""
    return {"message": f"Delete document {document_id} - not implemented yet"}
