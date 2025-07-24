import sys
import os

# Ensure src/ is in sys.path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from vectorstore.qdrant_search import (
    check_connection,
    get_collection_info,
    search_documents,
    search_with_filters
)


def test_search_functionality():
    """Test the search functionality"""
    print("Testing Qdrant Search functionality...")
    print("=" * 50)
    
    # Test connection
    if not check_connection():
        print("Make sure Qdrant is running on http://localhost:6333")
        return False
    
    print("Connected to Qdrant successfully")
    
    # Check collection
    collection_info = get_collection_info()
    if collection_info["status"] == "not_found":
        print(" Collection 'documents' not found")
        print(" Run qdrant_indexer.py first to create and populate the collection")
        return False
    
    print(f" Collection 'documents' found with {collection_info['points_count']} documents")
    
    # Test queries
    test_queries = [
        ("offers", 3),
        ("Dane oferentów", 2),
        ("Nazwa firmy", 4),
        ("contact information", 1)
    ]
    
    for query, limit in test_queries:
        print(f"\n🔍 Testing: '{query}' (limit: {limit})")
        print("-" * 40)
        
        results = search_documents(query, limit=limit)
        
        if results:
            print(f" Found {len(results)} results")
            for i, result in enumerate(results, 1):
                print(f"   {i}. Score: {result['score']:.3f}")
                print(f"      Text: {result['text'][:100]}...")
                if result['metadata']['filename']:
                    print(f"      Source: {result['metadata']['filename']}")
        else:
            print("  No results found")
    
    # Test filtered search
    print(f"\n Testing filtered search")
    print("-" * 40)
    
    try:
        filtered_results = search_with_filters(
            "experience",
            limit=3,
            filters={"confidentiality": "internal"}
        )
        print(f" Filtered search completed. Found {len(filtered_results)} results")
    except Exception as e:
        print(f"  Filtered search failed: {e}")
    
    print(f"\n Search functionality test completed!")
    return True

def demo_search():
    """Demo function showing search usage"""
    print("\n" + "="*50)
    print("DEMO: How to use search functions")
    print("="*50)
    
    # Basic search
    print("\n1. Basic search:")
    print("results = search_documents('Python programming', limit=3)")
    
    # Advanced search with filters
    print("\n2. Search with filters:")
    print("results = search_with_filters(")
    print("    'company policies',")
    print("    limit=5,")
    print("    filters={'department': 'HR', 'confidentiality': 'internal'}")
    print(")")
    
    # Result structure
    print("\n3. Result structure:")
    print("Each result contains:")
    print("- id: unique identifier")
    print("- score: similarity score (0-1)")
    print("- text: document chunk text")
    print("- metadata: filename, document_id, chunk_index, etc.")

if __name__ == "__main__":
    test_search_functionality()
    demo_search() 