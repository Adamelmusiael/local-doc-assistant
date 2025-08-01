"""
Test Server-Sent Events (SSE) Streaming Implementation

This file demonstrates how to test the new streaming chat endpoint.
"""

import requests
import json
import asyncio
import aiohttp

# Test the streaming endpoint
async def test_streaming_chat():
    """Test the SSE streaming endpoint"""
    url = "http://localhost:8000/chat/1/stream"
    
    # Example request data
    data = {
        "question": "What is in the uploaded documents?",
        "model": "mistral",
        "search_mode": "all"
    }
    
    print("Testing streaming chat endpoint...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    print("\nStreaming response:")
    print("-" * 50)
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=data) as response:
                if response.status == 200:
                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: '):
                            data_str = line[6:]  # Remove 'data: ' prefix
                            try:
                                chunk_data = json.loads(data_str)
                                print(f"[{chunk_data['type']}] {chunk_data.get('content', '')}")
                            except json.JSONDecodeError:
                                print(f"Raw: {data_str}")
                else:
                    print(f"Error: {response.status}")
                    print(await response.text())
    except Exception as e:
        print(f"Error: {e}")

def test_streaming_with_curl():
    """Generate curl command for testing"""
    curl_command = '''
curl -X POST "http://localhost:8000/chat/1/stream" \\
     -H "Content-Type: application/json" \\
     -H "Accept: text/event-stream" \\
     -d '{
       "question": "What is in the uploaded documents?",
       "model": "mistral",
       "search_mode": "all"
     }' \\
     --no-buffer
'''
    print("Test with curl:")
    print(curl_command)

def test_streaming_with_javascript():
    """Generate JavaScript code for testing in browser"""
    js_code = '''
// Test SSE streaming in browser console
const eventSource = new EventSource('http://localhost:8000/chat/1/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: "What is in the uploaded documents?",
    model: "mistral", 
    search_mode: "all"
  })
});

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log(`[${data.type}]`, data.content);
  
  if (data.type === 'done') {
    eventSource.close();
  }
};

eventSource.onerror = function(event) {
  console.error('SSE error:', event);
  eventSource.close();
};
'''
    print("Test with JavaScript (browser console):")
    print(js_code)

if __name__ == "__main__":
    print("=== SSE Streaming Test Examples ===\n")
    
    print("1. Python async test:")
    print("Run: python test_streaming.py")
    print()
    
    test_streaming_with_curl()
    print()
    
    test_streaming_with_javascript()
    print()
    
    # Run the async test
    # asyncio.run(test_streaming_chat())
