import re
import tiktoken
from typing import List, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter

try:
    from config.config_loader import load_config
    config = load_config()
except ImportError:
    config = {}


def count_tokens(text: str, encoding_name: str = "cl100k_base") -> int:
    """Count tokens in text using specified encoding."""
    try:
        encoder = tiktoken.get_encoding(encoding_name)
        return len(encoder.encode(text))
    except Exception:
        return len(text) // 4


def get_semantic_separators() -> List[str]:
    """Get prioritized list of semantic separators for intelligent splitting."""
    return [
        "\n\n\n",          # Section breaks
        "\n\n",            # Paragraph breaks
        "\n•",             # Bullet points
        "\n-",             # Dash lists
        r"\n\d+\.",        # Numbered lists
        ".\n",             # Sentence endings with newline
        ". ",              # Sentence endings
        ";\n",             # Semicolon with newline
        "; ",              # Semicolons
        "!\n",             # Exclamation with newline
        "! ",              # Exclamations
        "?\n",             # Question with newline
        "? ",              # Questions
        ",\n",             # Comma with newline
        ", ",              # Commas
        "\n",              # Line breaks
        " ",               # Word boundaries
        ""                 # Character level (last resort)
    ]


def validate_chunk_completeness(chunk: str) -> bool:
    """Validate that chunk ends at a semantic boundary when possible."""
    chunk = chunk.strip()
    if not chunk:
        return False
    
    complete_endings = ['.', '!', '?', ':', ';', '\n']
    return any(chunk.endswith(ending) for ending in complete_endings)


def calculate_optimal_overlap(chunk_size: int, content_type: str = "general") -> int:
    """Calculate optimal overlap size to preserve semantic units."""
    content_multipliers = {
        "technical": float(config.get("TECHNICAL_CONTENT_OVERLAP_RATIO", "0.20")),   
        "legal": float(config.get("LEGAL_CONTENT_OVERLAP_RATIO", "0.25")),        
        "narrative": float(config.get("NARRATIVE_CONTENT_OVERLAP_RATIO", "0.10")),   
        "general": float(config.get("GENERAL_CONTENT_OVERLAP_RATIO", "0.15"))      
    }
    
    overlap_ratio = content_multipliers.get(content_type, 0.15)
    optimal_overlap = int(chunk_size * overlap_ratio)
    
    return max(50, min(optimal_overlap, chunk_size // 3))


def chunk_text(
    text: str,
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
    content_type: str = "general",
    max_token_limit: Optional[int] = None
) -> List[str]:
    """
    Chunk text using token-based splitting with semantic awareness.
    
    Args:
        text: Input text to chunk
        chunk_size: Target chunk size in tokens
        chunk_overlap: Overlap size in tokens (auto-calculated if None)
        content_type: Content type for overlap optimization
        max_token_limit: Maximum tokens per chunk for validation
        
    Returns:
        List of text chunks
    """
    if not text or not text.strip():
        return []
    
    if chunk_size is None:
        chunk_size = int(config.get("DEFAULT_CHUNK_SIZE", "512"))
    
    if max_token_limit is None:
        max_token_limit = int(config.get("MAX_TOKEN_LIMIT", "8192"))
    
    if chunk_overlap is None:
        chunk_overlap = calculate_optimal_overlap(chunk_size, content_type)
    
    chunk_size = min(chunk_size, max_token_limit)
    
    try:
        splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=get_semantic_separators(),
            keep_separator=True,
            is_separator_regex=True
        )
        
        chunks = splitter.split_text(text)
        
        validated_chunks = []
        for chunk in chunks:
            chunk = chunk.strip()
            if chunk:
                token_count = count_tokens(chunk)
                if token_count <= max_token_limit:
                    validated_chunks.append(chunk)
                else:
                    sub_chunks = _split_oversized_chunk(chunk, max_token_limit, chunk_overlap)
                    validated_chunks.extend(sub_chunks)
        
        return validated_chunks
        
    except Exception:
        fallback_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size * 4,  # Approximate character count
            chunk_overlap=chunk_overlap * 4,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        return fallback_splitter.split_text(text)


def _split_oversized_chunk(chunk: str, max_tokens: int, overlap: int) -> List[str]:
    """Split chunks that exceed token limits."""
    words = chunk.split()
    sub_chunks = []
    current_chunk = []
    
    for word in words:
        test_chunk = " ".join(current_chunk + [word])
        if count_tokens(test_chunk) > max_tokens and current_chunk:
            sub_chunks.append(" ".join(current_chunk))
            
            overlap_words = current_chunk[-overlap//4:] if overlap > 0 else []
            current_chunk = overlap_words + [word]
        else:
            current_chunk.append(word)
    
    if current_chunk:
        sub_chunks.append(" ".join(current_chunk))
    
    return sub_chunks


