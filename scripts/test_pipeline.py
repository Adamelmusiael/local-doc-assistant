"""
Script to check end-to-end pipeline of document processing, indexing and searcing.
Usage: 
    0. Add some .pdf files to the temp/test_docs directory.
    !1. Ensure Qdrant server is running on port 6333.
    You should be able to see qdrant dashboard at: http://localhost:6333/dashboard
    If not, run:  'docker run -p 6333:6333 qdrant/qdrant'
    2. run: 'python test_pipeline.py'

"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "src"))

from vectorstore.qdrant_indexer import setup_collection, index_chunks, client 
from typing import List
import random 
from file_ingestion.preprocessor import preprocess_document_to_chunks
from vectorstore.qdrant_search import search_documents
from vectorstore.embedder import embed_text

def run_test():
    
    # Get documents, paths etc.
    test_docs_dir = Path(__file__).parent.parent / "temp" / "test_docs"
    if not test_docs_dir.exists():
        print(f"Test documents directory does not exist: {test_docs_dir}")
        return False
    
    pdf_files = list(test_docs_dir.glob("*.pdf"))
    if not pdf_files:
        print("No PDF files found in test dir.")
        return False

    print(f"Found {len(pdf_files)}")
    for pdf in pdf_files:
        print(f"    - {pdf.name}")

    # Step 1: Setup test collection. Use setup_collection?
    try:
        setup_collection(collection_name="test_documents")
        print("Collection setup successfully")
    except Exception as e:
        print(f"Failed to setup collection: {e}")
        print("💡 SOLUTION: Start Qdrant server with: docker run -p 6333:6333 qdrant/qdrant")
        print("   Or install Qdrant locally and start it on port 6333")
        return False
    # Step 2: Preprocess documents to chunks

    all_chunks = []
    for i, pdf_path in enumerate(pdf_files):
        metadata = {
            "document_id": i+1,
            "filename": pdf_path.name,
            "confidentiality": random.choice(["public", "internal", "confidential"]),
            "department": random.choice(["HR", "IT", "Sales"]),
            "client" : random.choice(["Client A", "Client B", "Client C"])
        }

        try:
            chunks = preprocess_document_to_chunks(str(pdf_path), metadata)
            all_chunks.extend(chunks)
        
        except Exception as e:
            print(f"Error processing file: { pdf_path.name}: {e}")
    
    print(f"Total chunks created: {len(all_chunks)}")
    if not all_chunks:
        print("No chunks created, cannot continue test.")
        return False
    
    # Step 3: Index chunks into qdrant index_chunks(chunks: List[dict]):
    try:
        index_chunks(all_chunks, collection_name="test_documents")
    except Exception as e:
        print(f"Failed to index chunks: {e}")

    # Step 4: Test  search queries + test search with filters
    print(f"Testing search queries :D")

    test_queries = [
        "strona internetowa",
        "dane oferenta",
        "specjalista ai",
        "doświadczenie w pracy",
        "work experience"
    ]

    for query in test_queries:
        try:
            print("Searching for:", query)
            results = search_documents(query, collection_name="test_documents", limit=5)
            
            if results:
                for j, result in enumerate(results,1):
                    print(f" {j}.Score: {result['score']:.3f}")
                    print(f"     File:  {result['metadata']['filename']}")
                    print(f"     Chunk: {result['metadata']['chunk_index']}")
                    print(f"     Text:  {result['text']}\n")
            else:
                print("No results found")
        except Exception as e:
            print("Error during search:", e)
    
    # Step 5: Cleanup - delete test collection if needed
    try:
        client.delete_collection("test_documents")
        print("Test collection deleted successfully")
    except Exception as e:
        print(f"Failed to delete test collection: {e}")
    
    return True

if __name__ == "__main__":
    try:
        print("Running test pipeline...")
        succeded = run_test()
        print(f" Script finished with status: {succeded}")
    except Exception as e:
        print(f"Error during test pipeline execution: {e}")
        sys.exit(1)

