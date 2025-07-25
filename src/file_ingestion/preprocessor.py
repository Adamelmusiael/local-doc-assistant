from typing import List, Dict

# Try relative imports first, fallback to direct imports for testing
try:
    from .extractor import extract_text_from_pdf
    from .chunker import chunk_text
except ImportError:
    # For standalone testing
    from .extractor import extract_text_from_pdf
    from .chunker import chunk_text

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
    chunks = chunk_text(raw_text, chunk_size=500, chunk_overlap=50)

    structured_chunks = []
    for i, chunk in enumerate(chunks):
        structured_chunks.append({
            "text": chunk,
            "chunk_index": i,
            **metadata
        })

    return structured_chunks




