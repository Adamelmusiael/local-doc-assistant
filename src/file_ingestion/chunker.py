from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List

def chunk_text(
        text: str,
        chunk_size: int = 500,
        chunk_overlap: int = 100
)-> List[str]:
    """Chunk text into smaller parts with specified size and overlap."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    return splitter.split_text(text)


