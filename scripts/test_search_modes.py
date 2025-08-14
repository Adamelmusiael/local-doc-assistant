#!/usr/bin/env python3
"""
Test Qdrant search functionality to identify search mode issues.
"""

import sys
import os
sys.path.append('src')

def test_qdrant_functionality():
    print("=== Qdrant Search Functionality Test ===\n")
    
    try:
        from vectorstore.qdrant_search import search_documents, search_documents_by_ids, get_collection_info, check_connection
        
        # Test connection
        print("1. Testing Qdrant connection...")
        if check_connection():
            print("✅ Qdrant connection successful")
            info = get_collection_info()
            vectors_count = info.get("vectors_count", "unknown")
            indexed_count = info.get("indexed_vectors_count", "unknown")
            print(f"   Collection points: {vectors_count}")
            print(f"   Indexed vectors: {indexed_count}")
        else:
            print("❌ Qdrant connection failed")
            return False
        
        # Test basic search (ALL mode)
        print("\n2. Testing basic search (ALL mode)...")
        results = search_documents("contract offer document", limit=5)
        print(f"   Basic search results: {len(results)}")
        
        doc_ids = []
        for i, result in enumerate(results):
            doc_id = result["metadata"].get("document_id")
            score = result["score"]
            text_preview = result["text"][:80].replace('\n', ' ')
            print(f"   {i+1}. Score: {score:.3f}, Doc ID: {doc_id}, Text: {text_preview}...")
            
            if doc_id and doc_id not in doc_ids:
                try:
                    doc_ids.append(int(doc_id))
                except (ValueError, TypeError):
                    print(f"      Warning: Invalid document ID: {doc_id}")
        
        # Test document ID search (SELECTED mode)
        if doc_ids:
            print(f"\n3. Testing document ID search (SELECTED mode) with IDs: {doc_ids[:2]}...")
            id_results = search_documents_by_ids("contract", doc_ids[:2], limit=3)
            print(f"   Document ID search results: {len(id_results)}")
            
            for i, result in enumerate(id_results):
                doc_id = result["metadata"].get("document_id")
                score = result["score"]
                text_preview = result["text"][:80].replace('\n', ' ')
                print(f"   {i+1}. Score: {score:.3f}, Doc ID: {doc_id}, Text: {text_preview}...")
        else:
            print("\n3. ❌ No valid document IDs found for testing SELECTED mode")
        
        # Test hybrid search
        if doc_ids:
            print(f"\n4. Testing hybrid search simulation...")
            # Simulate hybrid search (selected + additional)
            selected_results = search_documents_by_ids("contract", doc_ids[:1], limit=2)
            additional_results = search_documents("contract", limit=2)
            hybrid_results = selected_results + additional_results
            print(f"   Hybrid search results: {len(hybrid_results)} (selected: {len(selected_results)}, additional: {len(additional_results)})")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_qdrant_functionality()
    if success:
        print("\n✅ All tests completed successfully")
    else:
        print("\n❌ Tests failed")
        sys.exit(1)
