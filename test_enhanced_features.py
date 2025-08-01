#!/usr/bin/env python3
"""
Test script for enhanced chat API and file upload progress tracking
"""

import requests
import json
import asyncio
import websockets
import time
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

def test_async_file_upload():
    """Test async file upload with progress tracking"""
    print("\n=== Testing Async File Upload ===")
    
    # Create a test file
    test_file_path = Path("test_upload.pdf")
    test_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n trailer<</Size 4/Root 1 0 R>>startxref 169 %%EOF"
    
    with open(test_file_path, "wb") as f:
        f.write(test_content)
    
    try:
        # Upload file
        with open(test_file_path, "rb") as f:
            files = {"file": ("test.pdf", f, "application/pdf")}
            data = {
                "confidentiality": "public",
                "department": "test",
                "client": "test_client"
            }
            
            print("📤 Uploading file...")
            response = requests.post(f"{BASE_URL}/docs/upload_file_async", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Upload started: Task ID {result['task_id']}")
                
                # Track progress
                task_id = result['task_id']
                print("📊 Tracking progress...")
                
                for i in range(10):  # Check for 10 seconds
                    progress_response = requests.get(f"{BASE_URL}/docs/processing/{task_id}/status")
                    if progress_response.status_code == 200:
                        progress_data = progress_response.json()
                        if progress_data['success']:
                            data = progress_data['data']
                            print(f"⏳ Status: {data['status']} - {data['current_step']} ({data['progress_percentage']:.1f}%)")
                            
                            if data['status'] in ['completed', 'failed']:
                                break
                    
                    time.sleep(1)
                
                print("✅ File upload test completed")
            else:
                print(f"❌ Upload failed: {response.status_code} - {response.text}")
    
    except Exception as e:
        print(f"❌ Upload test error: {e}")
    
    finally:
        # Cleanup
        if test_file_path.exists():
            test_file_path.unlink()

def test_typing_indicators():
    """Test typing indicators"""
    print("\n=== Testing Typing Indicators ===")
    
    try:
        # Create a session first
        session_data = {
            "title": "Test Typing Session",
            "llm_model": "mistral"
        }
        session_response = requests.post(f"{BASE_URL}/chat/chat_sessions", json=session_data)
        
        if session_response.status_code == 200:
            session_id = session_response.json()['id']
            print(f"✅ Created session: {session_id}")
            
            # Set typing indicator
            typing_data = {
                "is_typing": True,
                "user_id": "test_user"
            }
            
            typing_response = requests.post(
                f"{BASE_URL}/chat/{session_id}/typing",
                json=typing_data
            )
            
            if typing_response.status_code == 200:
                print("✅ Typing indicator set")
                
                # Check typing status
                status_response = requests.get(f"{BASE_URL}/chat/{session_id}/typing")
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    print(f"📝 Typing users: {len(status_data['typing_users'])}")
                    print("✅ Typing indicators test completed")
                else:
                    print("❌ Failed to get typing status")
            else:
                print("❌ Failed to set typing indicator")
        else:
            print("❌ Failed to create session")
    
    except Exception as e:
        print(f"❌ Typing indicators test error: {e}")

async def test_websocket():
    """Test WebSocket connection"""
    print("\n=== Testing WebSocket Connection ===")
    
    try:
        uri = "ws://localhost:8000/chat/1/ws"
        print(f"🔌 Connecting to {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected")
            
            # Send typing indicator
            typing_message = {
                "type": "typing",
                "user_id": "test_user",
                "is_typing": True
            }
            
            await websocket.send(json.dumps(typing_message))
            print("📤 Sent typing indicator")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                print(f"📨 Received: {data['type']}")
                print("✅ WebSocket test completed")
            except asyncio.TimeoutError:
                print("⏰ No response received (timeout)")
            
    except Exception as e:
        print(f"❌ WebSocket test error: {e}")

def test_active_tasks():
    """Test active tasks endpoint"""
    print("\n=== Testing Active Tasks ===")
    
    try:
        response = requests.get(f"{BASE_URL}/docs/processing/active")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Active tasks: {data['total_active_tasks']}")
            for task in data['tasks']:
                print(f"  Task {task['task_id']}: {task['status']} ({task['progress_percentage']:.1f}%)")
            print("✅ Active tasks test completed")
        else:
            print(f"❌ Active tasks test failed: {response.status_code}")
    
    except Exception as e:
        print(f"❌ Active tasks test error: {e}")

def main():
    """Run all tests"""
    print("🧪 Enhanced Chat API and Upload Progress Tests")
    print("=" * 60)
    
    # Check if server is running
    if not test_health():
        print("\n💡 Make sure to run: docker-compose up")
        return
    
    # Run tests
    test_async_file_upload()
    test_typing_indicators()
    test_active_tasks()
    
    # Run async WebSocket test
    print("\n🔌 Running WebSocket test...")
    try:
        asyncio.run(test_websocket())
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
    
    print(f"\n🎉 All tests completed!")
    print(f"\n💡 Manual test commands:")
    print(f"  curl {BASE_URL}/docs/processing/active")
    print(f"  curl {BASE_URL}/chat/1/typing")
    print(f"  wscat -c ws://localhost:8000/chat/1/ws")

if __name__ == "__main__":
    main()
