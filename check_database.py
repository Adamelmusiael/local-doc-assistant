#!/usr/bin/env python3
"""
Script to check database contents and metadata
Usage: python check_database.py

Alternative ways to check documents:
1. API endpoints:
   - GET http://127.0.0.1:8000/docs/ (list all documents)
   - GET http://127.0.0.1:8000/docs/{id} (specific document)
   
2. Direct database query:
   - sqlite3 database.db
   - SELECT * FROM document;
"""

import sys
sys.path.append('.')

from src.db.database import get_session
from src.db.models import Document
from sqlmodel import select

def check_database():
    """Check and display all documents in the database"""
    print("=" * 50)
    print("DATABASE METADATA CHECK")
    print("=" * 50)
    
    try:
        with get_session() as session:
            # Get all documents
            statement = select(Document)
            documents = session.exec(statement).all()
            
            if not documents:
                print("📄 No documents found in database")
                return
            
            print(f"📄 Found {len(documents)} document(s) in database:")
            print("-" * 50)
            
            for i, doc in enumerate(documents, 1):
                print(f"\n{i}. Document ID: {doc.id}")
                print(f"   📁 Filename: {doc.filename}")
                print(f"   🔒 Confidentiality: {doc.confidentiality}")
                print(f"   🏢 Department: {doc.department}")
                print(f"   👤 Client: {doc.client}")
                print(f"   📍 File location: {doc.pointer_to_loc}")
                print(f"   📅 Created: {doc.created_at}")
                print(f"   ✅ Processed: {doc.processed}")
                
                # Check if file exists
                if doc.pointer_to_loc:
                    from pathlib import Path
                    file_exists = Path(doc.pointer_to_loc).exists()
                    print(f"   💾 File exists: {'✅ Yes' if file_exists else '❌ No'}")
            
            print("\n" + "=" * 50)
            print("✅ Database check completed successfully!")
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_database()
