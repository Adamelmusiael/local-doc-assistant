"""
Simple RAG Pipeline Test Script

This script tests different models with various questions using the actual FastAPI endpoints.
It's designed to be simple and work reliably with the existing system.
"""

import requests
import json
import time
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_PDFS_DIR = Path(__file__).parent / "test_pdfs"
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

def load_default_questions() -> List[str]:
    """Load default questions from config file"""
    questions_file = Path(__file__).parent / "test_questions.config"
    
    if not questions_file.exists():
        # Fallback questions if config file doesn't exist
        return [
            "What is the main business or service described in these documents?",
            "What are the key pricing or cost details mentioned?",
            "Who are the main contact persons and their roles?",
            "What are the technical requirements or specifications mentioned?",
            "What are the delivery timelines or project phases described?"
        ]
    
    questions = []
    try:
        with open(questions_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    questions.append(line)
        return questions if questions else [
            "What is the main business or service described in these documents?"
        ]
    except Exception as e:
        print(f"Warning: Could not load questions from config file: {e}")
        return ["What is the main business or service described in these documents?"]

class RAGTester:
    def __init__(self):
        self.session_id = None
        self.loaded_documents = []
        self.test_results = []
        
    def check_api_connection(self) -> bool:
        """Check if the API is running"""
        try:
            response = requests.get(f"{API_BASE_URL}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from the API, fallback to config if needed"""
        try:
            response = requests.get(f"{API_BASE_URL}/chat/models")
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                # Extract model IDs from the detailed model objects
                if models and isinstance(models[0], dict):
                    return [model.get("id", model.get("name", str(model))) for model in models]
                else:
                    return models
            else:
                # Fallback to config file models
                return self.get_models_from_config()
        except:
            return self.get_models_from_config()
    
    def get_models_from_config(self) -> List[str]:
        """Get models from config file as fallback"""
        try:
            # Try to import from config
            import sys
            sys.path.append(str(Path(__file__).parent.parent.parent / "src"))
            from config.config_loader import get_allowed_models
            return get_allowed_models()
        except:
            # Ultimate fallback
            return ["mistral", "llama3.1-8b-128k", "qwen2.5-1m"]
    
    def get_local_models_from_config(self) -> List[str]:
        """Get local models from config file"""
        try:
            # Try to import from config
            import sys
            sys.path.append(str(Path(__file__).parent.parent.parent / "src"))
            from config.config_loader import get_local_models
            return get_local_models()
        except:
            # Ultimate fallback
            return ["mistral", "llama3.1-8b-128k", "qwen2.5-1m"]
    
    def get_existing_documents(self) -> List[Dict[str, Any]]:
        """Get list of documents already in the system"""
        try:
            # First try the list endpoint
            response = requests.get(f"{API_BASE_URL}/docs/list_documents")
            if response.status_code == 200:
                data = response.json()
                return data.get("documents", [])
            else:
                # If list endpoint fails, try to get document IDs from stats and manually build list
                stats_response = requests.get(f"{API_BASE_URL}/docs/stats")
                if stats_response.status_code == 200:
                    stats = stats_response.json().get("statistics", {})
                    total_docs = stats.get("total_documents", 0)
                    if total_docs > 0:
                        # Return placeholder documents - the IDs will be determined later
                        return [{"id": i+1, "filename": f"Document_{i+1}"} for i in range(total_docs)]
                return []
        except Exception as e:
            print(f"Warning: Error getting documents: {e}")
            return []
    
    def create_chat_session(self) -> int:
        """Create a new chat session"""
        try:
            data = {
                "title": f"RAG Test Session - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "llm_model": "mistral",
                "status": "active"
            }
            response = requests.post(f"{API_BASE_URL}/chat/chat_sessions", json=data)
            if response.status_code == 200:
                return response.json()["id"]
            else:
                print(f"Warning: Could not create session, using default session ID 1")
                return 1
        except Exception as e:
            print(f"Warning: Could not create session ({e}), using default session ID 1")
            return 1
    
    def upload_test_pdfs(self) -> bool:
        """Upload PDFs from test_pdfs directory"""
        pdf_files = list(TEST_PDFS_DIR.glob("*.pdf"))
        if not pdf_files:
            print("ERROR: No PDF files found in test_pdfs directory")
            return False
        
        print(f"FOUND {len(pdf_files)} PDF files to upload:")
        for pdf_file in pdf_files:
            print(f"   - {pdf_file.name}")
        
        uploaded_count = 0
        for pdf_file in pdf_files:
            try:
                print(f"Uploading {pdf_file.name}...", end=" ")
                
                with open(pdf_file, 'rb') as f:
                    files = {'file': (pdf_file.name, f, 'application/pdf')}
                    data = {'confidentiality': 'public'}
                    
                    response = requests.post(
                        f"{API_BASE_URL}/docs/upload_file", 
                        files=files, 
                        data=data,
                        timeout=60
                    )
                
                if response.status_code == 200:
                    doc_info = response.json()
                    self.loaded_documents.append(doc_info)
                    print("SUCCESS")
                    uploaded_count += 1
                else:
                    print(f"ERROR: {response.status_code}")
                    
            except Exception as e:
                print(f"ERROR: {str(e)}")
        
        print(f"SUCCESS: Uploaded {uploaded_count}/{len(pdf_files)} documents")
        return uploaded_count > 0
    
    def ask_question(self, question: str, model: str, document_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """Ask a question using the chat API"""
        try:
            data = {
                "question": question,
                "model": model,
                "selected_document_ids": document_ids,
                "search_mode": "all"
            }
            
            start_time = time.time()
            response = requests.post(
                f"{API_BASE_URL}/chat/{self.session_id}/message", 
                json=data,
                timeout=120
            )
            end_time = time.time()
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "answer": result.get("answer", ""),
                    "response_time": end_time - start_time,
                    "sources": result.get("sources", []),
                    "chunks_used": len(result.get("sources", [])),
                    "confidence": result.get("confidence", 0),
                    "hallucination": result.get("hallucination", 0),
                    "model_used": result.get("model", model)
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": end_time - start_time
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response_time": time.time() - start_time if 'start_time' in locals() else 0
            }
    
    def select_load_option(self) -> bool:
        """Ask user if they want to load new files or use existing ones"""
        print("\nDocument Loading Options:")
        print("1. Load new PDFs from test_pdfs folder")
        print("2. Use existing documents in the system")
        
        existing_docs = self.get_existing_documents()
        if existing_docs:
            print(f"   (Found {len(existing_docs)} existing documents)")
            for doc in existing_docs[:3]:  # Show first 3
                print(f"   - {doc.get('filename', 'Unknown')}")
            if len(existing_docs) > 3:
                print(f"   ... and {len(existing_docs) - 3} more")
        else:
            print("   (No existing documents found)")
        
        while True:
            choice = input("\nSelect option (1/2): ").strip()
            if choice == "1":
                return True  # Load new files
            elif choice == "2":
                if existing_docs:
                    self.loaded_documents = existing_docs
                    return False  # Use existing
                else:
                    print("ERROR: No existing documents found. Please choose option 1.")
            else:
                print("ERROR: Invalid choice. Please enter 1 or 2.")
    
    def select_models(self) -> List[str]:
        """Let user select which models to test"""
        available_models = self.get_available_models()
        
        print(f"\nAvailable Models ({len(available_models)} found):")
        for i, model in enumerate(available_models, 1):
            print(f"{i:2}. {model}")
        
        print("\nSelection Options:")
        print("A. Test all models")
        print("B. Test only local models (recommended)")
        print("C. Choose specific models")
        
        while True:
            choice = input("\nSelect option (A/B/C): ").strip().upper()
            
            if choice == "A":
                return available_models
            elif choice == "B":
                local_models_config = self.get_local_models_from_config()
                local_models = [m for m in available_models if m in local_models_config]
                if local_models:
                    return local_models
                else:
                    print("ERROR: No local models found. Using first 3 available models.")
                    return available_models[:3]  # Use first 3 models as fallback
            elif choice == "C":
                selected = []
                print("Enter model numbers (e.g., 1,3,5 or 1-3):")
                selection = input("Models: ").strip()
                
                try:
                    # Parse selection (support both comma-separated and ranges)
                    if '-' in selection:
                        start, end = map(int, selection.split('-'))
                        indices = list(range(start-1, end))
                    else:
                        indices = [int(x.strip())-1 for x in selection.split(',')]
                    
                    for idx in indices:
                        if 0 <= idx < len(available_models):
                            selected.append(available_models[idx])
                    
                    if selected:
                        return selected
                    else:
                        print("ERROR: No valid models selected.")
                except ValueError:
                    print("ERROR: Invalid format. Use numbers like 1,2,3 or 1-3")
            else:
                print("ERROR: Invalid choice. Please enter A, B, or C.")
    
    def select_questions(self) -> List[str]:
        """Let user select which questions to ask"""
        default_questions = load_default_questions()
        
        print(f"\nTest Questions:")
        print("1. Use default questions (recommended)")
        print("2. Add custom questions")
        
        print(f"\nDefault Questions ({len(default_questions)}):")
        for i, q in enumerate(default_questions, 1):
            print(f"{i:2}. {q}")
        
        while True:
            choice = input("\nSelect option (1/2): ").strip()
            
            if choice == "1":
                return default_questions
            elif choice == "2":
                questions = default_questions.copy()
                print("\nAdd your custom questions (empty line to finish):")
                while True:
                    q = input("Q: ").strip()
                    if not q:
                        break
                    questions.append(q)
                return questions
            else:
                print("ERROR: Invalid choice. Please enter 1 or 2.")
    
    def run_tests(self, models: List[str], questions: List[str]) -> None:
        """Run the actual tests"""
        total_tests = len(models) * len(questions)
        print(f"\nStarting {len(models)} models x {len(questions)} questions = {total_tests} tests")
        
        # Get document IDs for testing
        doc_ids = [doc.get("id") for doc in self.loaded_documents if doc.get("id")] if self.loaded_documents else None
        if doc_ids:
            print(f"Using {len(doc_ids)} documents: {doc_ids}")
        
        test_number = 0
        for question_idx, question in enumerate(questions, 1):
            print(f"\nQuestion {question_idx}/{len(questions)}: {question}")
            print("-" * 80)
            
            for model_idx, model in enumerate(models, 1):
                test_number += 1
                print(f"[{test_number}/{total_tests}] Testing {model}...", end=" ")
                
                result = self.ask_question(question, model, doc_ids)
                
                if result["success"]:
                    print(f"SUCCESS {result['response_time']:.1f}s ({result['chunks_used']} chunks)")
                    self.test_results.append({
                        "question_number": question_idx,
                        "question": question,
                        "model": model,
                        "success": True,
                        "answer": result["answer"],
                        "response_time": result["response_time"],
                        "chunks_used": result["chunks_used"],
                        "sources": result["sources"],
                        "confidence": result.get("confidence", 0),
                        "hallucination": result.get("hallucination", 0),
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    print(f"ERROR: {result.get('error', 'Unknown error')}")
                    self.test_results.append({
                        "question_number": question_idx,
                        "question": question,
                        "model": model,
                        "success": False,
                        "error": result.get("error", "Unknown error"),
                        "response_time": result["response_time"],
                        "timestamp": datetime.now().isoformat()
                    })
        
        print(f"\nAll tests completed! ({len(self.test_results)} results)")
    
    def save_results(self, models: List[str], questions: List[str]) -> str:
        """Save test results to a text file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"rag_test_results_{timestamp}.txt"
        filepath = RESULTS_DIR / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            # Header
            f.write("RAG PIPELINE TEST RESULTS\n")
            f.write("=" * 80 + "\n\n")
            
            # Test Configuration
            f.write("TEST CONFIGURATION\n")
            f.write("-" * 40 + "\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Models tested: {', '.join(models)}\n")
            f.write(f"Questions: {len(questions)}\n")
            f.write(f"Documents used: {len(self.loaded_documents)}\n")
            f.write(f"Total tests: {len(models)} x {len(questions)} = {len(models) * len(questions)}\n\n")
            
            # Documents used
            if self.loaded_documents:
                f.write("DOCUMENTS USED\n")
                f.write("-" * 40 + "\n")
                for doc in self.loaded_documents:
                    f.write(f"- {doc.get('filename', 'Unknown')} (ID: {doc.get('id', 'N/A')})\n")
                f.write("\n")
            
            # Summary
            successful_tests = sum(1 for r in self.test_results if r["success"])
            f.write("SUMMARY\n")
            f.write("-" * 40 + "\n")
            f.write(f"Successful tests: {successful_tests}/{len(self.test_results)}\n")
            f.write(f"Success rate: {(successful_tests/len(self.test_results)*100):.1f}%\n\n")
            
            # Model performance
            model_stats = {}
            for result in self.test_results:
                model = result["model"]
                if model not in model_stats:
                    model_stats[model] = {"total": 0, "successful": 0, "total_time": 0}
                
                model_stats[model]["total"] += 1
                if result["success"]:
                    model_stats[model]["successful"] += 1
                    model_stats[model]["total_time"] += result["response_time"]
            
            f.write("MODEL PERFORMANCE\n")
            f.write("-" * 40 + "\n")
            for model, stats in model_stats.items():
                success_rate = (stats["successful"] / stats["total"] * 100) if stats["total"] > 0 else 0
                avg_time = stats["total_time"] / stats["successful"] if stats["successful"] > 0 else 0
                f.write(f"{model:20} | {success_rate:5.1f}% success | {avg_time:5.1f}s avg\n")
            f.write("\n")
            
            # Detailed Results
            f.write("DETAILED RESULTS\n")
            f.write("=" * 80 + "\n\n")
            
            for question_num in range(1, len(questions) + 1):
                question_results = [r for r in self.test_results if r["question_number"] == question_num]
                if question_results:
                    question = question_results[0]["question"]
                    f.write(f"QUESTION {question_num}: {question}\n")
                    f.write("-" * 80 + "\n")
                    
                    for result in question_results:
                        model = result["model"]
                        if result["success"]:
                            f.write(f"\nMODEL: {model}\n")
                            f.write(f"Response time: {result['response_time']:.2f} seconds\n")
                            f.write(f"Chunks used: {result['chunks_used']}\n")
                            f.write(f"Answer:\n{result['answer']}\n")
                            
                            if result.get("sources"):
                                f.write(f"\nSources ({len(result['sources'])} chunks):\n")
                                for i, source in enumerate(result["sources"], 1):
                                    filename = source.get("filename", "Unknown")
                                    f.write(f"  {i}. {filename}\n")
                        else:
                            f.write(f"\nMODEL: {model}\n")
                            f.write(f"FAILED: {result.get('error', 'Unknown error')}\n")
                    
                    f.write("\n" + "=" * 80 + "\n")
            
            # Questions used
            f.write("\nALL QUESTIONS TESTED\n")
            f.write("-" * 40 + "\n")
            for i, question in enumerate(questions, 1):
                f.write(f"{i}. {question}\n")
        
        return str(filepath)
    
    def print_summary(self):
        """Print a quick summary of results"""
        if not self.test_results:
            return
        
        successful = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        
        print(f"\nQUICK SUMMARY")
        print(f"=" * 50)
        print(f"Successful tests: {successful}/{total} ({successful/total*100:.1f}%)")
        
        if successful > 0:
            avg_time = sum(r["response_time"] for r in self.test_results if r["success"]) / successful
            print(f"Average response time: {avg_time:.2f} seconds")
            
            # Best performing model
            model_performance = {}
            for result in self.test_results:
                if result["success"]:
                    model = result["model"]
                    if model not in model_performance:
                        model_performance[model] = []
                    model_performance[model].append(result["response_time"])
            
            if model_performance:
                best_model = min(model_performance.keys(), 
                               key=lambda m: sum(model_performance[m]) / len(model_performance[m]))
                best_time = sum(model_performance[best_model]) / len(model_performance[best_model])
                print(f"Best model: {best_model} ({best_time:.2f}s avg)")

def main():
    """Main function to run the RAG pipeline test"""
    print("RAG Pipeline Test")
    print("=" * 50)
    print("Simple testing tool for comparing model performance")
    
    tester = RAGTester()
    
    # Check API connection
    print("\nChecking API connection...", end=" ")
    if not tester.check_api_connection():
        print("ERROR")
        print("Cannot connect to API at http://localhost:8000")
        print("Make sure the FastAPI server is running:")
        print("   uvicorn src.app.main:app --reload")
        return
    print("SUCCESS")
    
    # Create chat session
    print("Creating chat session...", end=" ")
    tester.session_id = tester.create_chat_session()
    print(f"SUCCESS (Session ID: {tester.session_id})")
    
    # 1. Ask about loading documents
    load_new_files = tester.select_load_option()
    
    if load_new_files:
        if not tester.upload_test_pdfs():
            print("ERROR: Failed to upload documents. Exiting.")
            return
    else:
        if not tester.loaded_documents:
            print("ERROR: No documents available for testing. Exiting.")
            return
        print(f"Using {len(tester.loaded_documents)} existing documents")
    
    # 2. Select models
    models = tester.select_models()
    print(f"Selected {len(models)} models: {', '.join(models)}")
    
    # 3. Select questions
    questions = tester.select_questions()
    print(f"Selected {len(questions)} questions")
    
    # 4. Confirm and run tests
    total_tests = len(models) * len(questions)
    print(f"\nTEST SUMMARY:")
    print(f"   Models: {len(models)} ({', '.join(models)})")
    print(f"   Questions: {len(questions)}")
    print(f"   Documents: {len(tester.loaded_documents)}")
    print(f"   Total tests: {total_tests}")
    
    confirm = input(f"\nRun {total_tests} tests? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Test cancelled.")
        return
    
    # 5. Run tests and save results
    tester.run_tests(models, questions)
    
    # 6. Save and display results
    results_file = tester.save_results(models, questions)
    tester.print_summary()
    
    print(f"\nFull results saved to: {results_file}")
    print("Test completed!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nTest interrupted by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
