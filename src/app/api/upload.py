from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import uuid
from datetime import datetime
from src.db.database import get_session
from src.db.models import Document

router = APIRouter()

UPLOAD_DIR = Path("upload_files")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    confidentiality: str = Form(...),
    department: str = Form(...),
    client: str = Form(...)
):
    """Upload a PDF file with metadata"""
    
    # is PDF?
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed [currently]")
    
    # is empty? ! Warning: may cause errror if file.size is not available !!! DO TESTOWANIA 
    if file.size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Randomize filename
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
        response = {
            "message": "File uploaded successfully and metadata saved to database",
            "document_id": document_id,
            "filename": file.filename,
            "saved_as": unique_filename,
            "file_path": str(file_path),
            "file_size": len(contents),
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
