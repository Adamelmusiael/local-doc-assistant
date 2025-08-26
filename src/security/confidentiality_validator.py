"""
Security module for handling confidentiality validation and access control.
"""
from typing import List, Dict, Optional

from config import is_local_model

try:
    from db.database import get_session
    from db.models import Document
    from sqlmodel import select
except ImportError:
    get_session = None
    Document = None
    select = None


def validate_document_access(documents: List[Dict], model_name: str) -> List[Dict]:
    """
    Filter documents based on confidentiality level and model type.
    
    Args:
        documents (List[Dict]): List of documents with metadata (from vector search)
        model_name (str): Name of the model requesting access
        
    Returns:
        List[Dict]: Filtered documents that the model can access
    """
    if not documents:
        return documents
    
    if is_local_model(model_name):
        return documents
    
    filtered_docs = []
    for doc in documents:
        confidentiality = doc.get('metadata', {}).get('confidentiality', '')
        
        if not confidentiality or confidentiality.lower() in ['public', 'internal', '']:
            filtered_docs.append(doc)
    
    return filtered_docs


def has_confidential_documents(document_ids: List[int]) -> bool:
    """
    Check if any of the provided document IDs contain confidential data.
    
    Args:
        document_ids (List[int]): List of document IDs to check
        
    Returns:
        bool: True if any document is confidential
    """
    if not document_ids:
        return False
    
    try:
        if get_session is None or Document is None or select is None:
            raise ImportError("Database modules not available")
        
        with get_session() as session:
            statement = select(Document).where(Document.id.in_(document_ids))
            documents = session.exec(statement).all()
            
            for doc in documents:
                if doc.confidentiality and doc.confidentiality.lower() == 'confidential':
                    return True
                    
        return False
        
    except Exception as e:
        print(f"Error checking document confidentiality: {e}")
        return True


def validate_model_document_compatibility(model_name: str, document_ids: Optional[List[int]] = None) -> tuple[bool, str]:
    """
    Validate if a model can access the specified documents based on confidentiality.
    
    Args:
        model_name (str): Name of the model
        document_ids (Optional[List[int]]): List of document IDs, if None checks all access
        
    Returns:
        tuple[bool, str]: (is_valid, error_message)
    """
    if not model_name:
        return False, "Model name is required"
    
    if is_local_model(model_name):
        return True, ""
    
    if document_ids and has_confidential_documents(document_ids):
        return False, f"External model '{model_name}' cannot access confidential documents. Please use a local model or remove confidential files."
    
    return True, ""
