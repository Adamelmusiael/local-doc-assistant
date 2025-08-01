"""
Simple WebSocket test script to validate connection to the simplified WebSocket endpoint
"""
import asyncio
import websockets
import json


async def test_websocket():
    uri = "ws://localhost:8000/chat/1/ws"
    
    try:
        print(f"Connecting to {uri}...")
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection established!")
            
            # Test ping/pong
            ping_message = {"type": "ping"}
            await websocket.send(json.dumps(ping_message))
            print("📤 Sent ping message")
            
            response = await websocket.recv()
            print(f"📥 Received: {response}")
            
            # Test chat message
            chat_message = {
                "type": "chat_message",
                "question": "Hello, this is a test message",
                "model": "mistral"
            }
            await websocket.send(json.dumps(chat_message))
            print("📤 Sent chat message")
            
            # Wait for acknowledgment
            ack = await websocket.recv()
            print(f"📥 Received acknowledgment: {ack}")
            
            # Wait for streaming response chunks
            chunk_count = 0
            while chunk_count < 5:  # Limit to first 5 chunks
                try:
                    chunk = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    chunk_data = json.loads(chunk)
                    print(f"📥 Chunk {chunk_count + 1}: {chunk_data.get('type', 'unknown')} - {chunk_data.get('content', '')[:50]}...")
                    chunk_count += 1
                    
                    if chunk_data.get('type') == 'complete':
                        print("✅ Received completion signal")
                        break
                        
                except asyncio.TimeoutError:
                    print("⏱️  Timeout waiting for response")
                    break
                except Exception as e:
                    print(f"❌ Error receiving chunk: {e}")
                    break
            
            print("✅ WebSocket test completed successfully!")
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ Connection refused - server might not be running on localhost:8000")
    except websockets.exceptions.InvalidURI:
        print("❌ Invalid WebSocket URI")
    except Exception as e:
        print(f"❌ WebSocket connection error: {e}")


if __name__ == "__main__":
    print("🔧 Testing simplified WebSocket connection...")
    asyncio.run(test_websocket())
