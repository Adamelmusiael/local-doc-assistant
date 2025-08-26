"""
Security module for confidentiality validation and access control.
"""
from .confidentiality_validator import (
    validate_document_access,
    has_confidential_documents,
    validate_model_document_compatibility
)

__all__ = [
    'validate_document_access',
    'has_confidential_documents',
    'validate_model_document_compatibility'
]
