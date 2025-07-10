from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def upload_file():
    """Upload a file endpoint"""
    return {"message": "Upload endpoint - not implemented yet"}

@router.get("/status")
async def upload_status():
    """Get upload status"""
    return {"status": "Upload service ready"}
