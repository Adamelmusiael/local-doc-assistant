# ENDPOINTS EXPLANATION


## CHAT endpoints

### Session management
1. /chat/chat_sessions - POST - create new chat session 
2. /chat/chat_sessions - GET - download chats existing insights - name, id, (metadata)... 
3. /chat/chat_sessions/{session_id} - GET - download insights of specific chat more insights - Not sure if necessery rn 
4. /chat/chat_sessions/{session_id} - DELETE - delete chat, messages, metadata 

### Sending and downloading messages
1. /chat/{session_id}/message - POST - send new message to the model, returns answer, references do used chunks/docs, certainty of the correct answer 
2. /chat/{session_id}/messages - GET - download messages history 

