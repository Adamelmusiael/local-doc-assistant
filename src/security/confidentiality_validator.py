"""
Security module for handling confidentiality validation and access control.
"""
from typing import List, Dict, Optional
from config import is_local_model


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
    
    # If model is local, it can access all documents
    if is_local_model(model_name):
        return documents
    
    # External models can only access non-confidential documents
    filtered_docs = []
    for doc in documents:
        confidentiality = doc.get('metadata', {}).get('confidentiality', '')
        
        # Allow access if not confidential (public, internal, or empty)
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
        from db.database import get_session
        from db.models import Document
        from sqlmodel import select
        
        with get_session() as session:
            # Query documents by IDs
            statement = select(Document).where(Document.id.in_(document_ids))
            documents = session.exec(statement).all()
            
            # Check if any document is confidential
            for doc in documents:
                if doc.confidentiality and doc.confidentiality.lower() == 'confidential':
                    return True
                    
        return False
        
    except Exception as e:
        # If we can't check, assume there might be confidential data (fail-safe)
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
    
    # Local models can access everything
    if is_local_model(model_name):
        return True, ""
    
    # For external models, check if any documents are confidential
    if document_ids and has_confidential_documents(document_ids):
        return False, f"External model '{model_name}' cannot access confidential documents. Please use a local model or remove confidential files."
    
    return True, ""
