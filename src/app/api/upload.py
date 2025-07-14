from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import uuid
from datetime import datetime
from typing import Optional
from src.db.database import get_session
from src.db.models import Document

router = APIRouter()

UPLOAD_DIR = Path("upload_files")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    #filename: Optional[str] = Form(None),
    confidentiality: str = Form(...),
    department: Optional[str] = Form(None),
    client: Optional[str] = Form(None)
):
    """Upload a PDF file with metadata"""
    
    # is PDF?
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed [currently]")
    
    # is empty? ! Warning: may cause errror if file.size is not available !!! DO TESTOWANIA 
    if file.size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Randomize filename - for unique path
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"

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
