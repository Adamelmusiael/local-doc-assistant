from typing import List, Dict

try:
    from .extractor import extract_text_from_pdf
    from .chunker import chunk_text
    from config.config_loader import load_config
    config = load_config()
except ImportError:
    from .extractor import extract_text_from_pdf
    from .chunker import chunk_text
    config = {}

def preprocess_document_to_chunks(
    pdf_path: str,
    metadata: Dict
) -> List[Dict]:
    """
    Converts a PDF document into structured chunks with metadata.
    
    Args:
        pdf_path (str): Absolute path to the PDF file to process
        metadata (Dict): Document metadata to attach to each chunk
    
    Returns:
        List[Dict]: List of chunks with text, chunk_index, and metadata fields
    """
    raw_text = extract_text_from_pdf(pdf_path)
    
    content_type = _detect_content_type(raw_text)
    chunk_size = int(config.get("DEFAULT_CHUNK_SIZE", "512"))
    max_token_limit = int(config.get("MAX_TOKEN_LIMIT", "8192"))
    
    chunks = chunk_text(
        text=raw_text,
        chunk_size=chunk_size,
        chunk_overlap=None,  # Auto-calculated based on content type
        content_type=content_type,
        max_token_limit=max_token_limit
    )

    structured_chunks = []
    for i, chunk in enumerate(chunks):
        structured_chunks.append({
            "text": chunk,
            "chunk_index": i,
            **metadata
        })

    return structured_chunks


def _detect_content_type(text: str) -> str:
    """Detect content type for optimal chunking strategy."""
    text_lower = text.lower()
    
    technical_indicators = [
        "api", "configuration", "implementation", "specification",
        "technical", "system", "architecture", "infrastructure"
    ]
    
    legal_indicators = [
        "agreement", "contract", "terms", "conditions", "liability",
        "warranty", "compliance", "regulation"
    ]
    
    if any(indicator in text_lower for indicator in legal_indicators):
        return "legal"
    elif any(indicator in text_lower for indicator in technical_indicators):
        return "technical"
    else:
        return "general"




