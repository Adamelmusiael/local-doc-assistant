from typing import List, Dict

# Try relative imports first, fallback to direct imports for testing
try:
    from .extractor import extract_text_from_pdf
    from .chunker import chunk_text
except ImportError:
    # For standalone testing
    from extractor import extract_text_from_pdf
    from chunker import chunk_text

def preprocess_document_to_chunks(
    pdf_path: str,
    metadata: Dict
) -> List[Dict]:
    """Return list of chunks with metadata from given PDF file."""
    raw_text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(raw_text,chunk_size=500, chunk_overlap=50)

    structured_chunks = []
    for i, chunk in enumerate(chunks):
        structured_chunks.append({
            "text": chunk,
            "chunk_index": i,
            **metadata
        })

    return structured_chunks


# Test function to validate the preprocessing
if __name__ == "__main__":
    import os
    
    def test_preprocess_document_to_chunks():
        """Simple test for the preprocess_document_to_chunks function"""
        
        # Test file path (assuming the CV file exists)
        test_pdf_path = r"C:\projects\AI-Assistant\src\app\file_ingestion\Adam Musiał CV AI Specialist.pdf"
        
        # Check if test file exists
        if not os.path.exists(test_pdf_path):
            print(f"❌ Test file not found: {test_pdf_path}")
            return False
        
        # Test metadata
        test_metadata = {
            "document_id": 123,
            "filename": "test_cv.pdf",
            "confidentiality": "internal",
            "department": "HR",
            "client": "Test Client"
        }
        
        try:
            print("🧪 Running test for preprocess_document_to_chunks...")
            
            # Call the function
            result = preprocess_document_to_chunks(test_pdf_path, test_metadata)
            
            # Basic validations
            assert isinstance(result, list), "Result should be a list"
            assert len(result) > 0, "Result should not be empty"
            
            # Check first chunk structure
            first_chunk = result[0]
            assert isinstance(first_chunk, dict), "Each chunk should be a dictionary"
            assert "text" in first_chunk, "Chunk should have 'text' field"
            assert "chunk_index" in first_chunk, "Chunk should have 'chunk_index' field"
            assert first_chunk["chunk_index"] == 0, "First chunk index should be 0"
            
            # Check if metadata is included
            for key, value in test_metadata.items():
                assert key in first_chunk, f"Chunk should contain metadata key: {key}"
                assert first_chunk[key] == value, f"Metadata value mismatch for {key}"
            
            # Check chunk numbering
            for i, chunk in enumerate(result[:3]):  # Check first 3 chunks
                assert chunk["chunk_index"] == i, f"Chunk {i} has wrong index"
            
            print(f"✅ Test passed!")
            print(f"📊 Total chunks generated: {len(result)}")
            print(f"📝 First chunk text preview: {result[0]['text'][:100]}...")
            print(f"🏷️  Metadata included: {list(test_metadata.keys())}")
            
            return True
            
        except Exception as e:
            print(f"❌ Test failed with error: {str(e)}")
            return False
    
    # Run the test
    test_preprocess_document_to_chunks()


