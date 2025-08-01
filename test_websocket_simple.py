"""
Fixed WebSocket test script to validate the simplified WebSocket endpoint
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
            
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                response_data = json.loads(response)
                if response_data.get("type") == "pong":
                    print("✅ Received pong response - ping/pong working!")
                else:
                    print(f"📥 Received: {response}")
            except asyncio.TimeoutError:
                print("⏱️  No pong response received")
            
            print("✅ WebSocket basic functionality test completed!")
            
    except ConnectionRefusedError:
        print("❌ Connection refused - server might not be running on localhost:8000")
    except Exception as e:
        print(f"❌ WebSocket connection error: {e}")


if __name__ == "__main__":
    print("🔧 Testing simplified WebSocket connection...")
    asyncio.run(test_websocket())
