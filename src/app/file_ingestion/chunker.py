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



if __name__ == "__main__":
    # Test with a sample text
    sample_text = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus."
    
    chunked_text = chunk_text(sample_text, chunk_size=50, chunk_overlap=10)
    for chunk in chunked_text:
        print(f"{chunk}\n")