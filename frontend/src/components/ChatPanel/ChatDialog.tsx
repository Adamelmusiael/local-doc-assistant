import ChatInput from "./ChatInput";
import "./ChatDialog.scss";
import { useState } from "react";
import ChatMessage from "./ChatMessage";
import { SearchMode } from "../../types";
import { useChat } from "../../contexts/ChatContext";

interface ChatDialogProps {
  selectedModel: string;
  searchMode: SearchMode;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ selectedModel, searchMode }) => {
  const { state: chatState, sendMessage } = useChat();
  const [isLoading, setIsLoading] = useState(false);

  // Get current chat messages
  const messages = chatState.currentChat?.messages || [];

  const handleSendMessage = async (message: string, _model: string, _searchMode: SearchMode, _attachments?: File[]) => {
    // Use the chat context to send the message
    sendMessage(message);
    
    // TODO: In the next iteration, we'll add actual AI response generation
    // For now, we're just storing the user message
    setIsLoading(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Call backend API to generate AI response
      // const response = await chatAPI.sendMessage({
      //   chatId: chatState.currentChat?.id || '',
      //   question: message,
      //   model,
      //   searchMode,
      //   selectedDocumentIds: attachments?.map(f => f.name) // placeholder
      // });
      
    } catch (error) {
      console.error('Chat response failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-dialog">
      <div className="chat-dialog__messages">
        {!chatState.currentChat ? (
          <div className="chat-dialog__no-chat">
            <h3>No chat selected</h3>
            <p>Select a chat from the sidebar or create a new one to start chatting.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-dialog__no-messages">
            <h3>Start the conversation</h3>
            <p>Send a message to begin chatting with the AI assistant.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message}
            />
          ))
        )}
      </div>
      {chatState.currentChat && (
        <ChatInput 
          selectedModel={selectedModel}
          searchMode={searchMode}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          maxLength={4000}
        />
      )}
    </div>
  );
};

export default ChatDialog;
