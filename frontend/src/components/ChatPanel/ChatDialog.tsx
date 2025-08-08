import ChatInput from "./ChatInput";
import "./ChatDialog.scss";
import ChatMessage from "./ChatMessage";
import { SearchMode } from "../../types";
import { useChat } from "../../contexts/ChatContext";
import { useFile } from "../../contexts/FileContext";
import { useEffect, useRef } from "react";

interface ChatDialogProps {
  selectedModel: string;
  searchMode: SearchMode;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ selectedModel, searchMode }) => {
  const { state: chatState, sendMessage } = useChat();
  const { state: fileState } = useFile();
  
  // Ref for the messages container to control scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get current chat messages
  const messages = chatState.currentChat?.messages || [];

  // Check if any message is currently being generated
  const isLoading = messages.some(msg => 
    msg.status === 'pending' || 
    msg.status === 'sending' || 
    msg.status === 'streaming' || 
    msg.isGenerating
  );

  // Auto-scroll to bottom when new messages are added or when streaming
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Smooth scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length, messages[messages.length - 1]?.content]); // Trigger on new messages or content changes

  const handleSendMessage = async (message: string, _model: string, _searchMode: SearchMode, _attachments?: File[]) => {
    // Get selected files from FileContext
    const selectedFiles = fileState.files.filter(file => 
      chatState.selectedFiles.includes(file.id)
    );

    // Convert to attachment format
    const attachments = selectedFiles.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.originalName || file.name,
      type: file.type,
      size: file.size,
      fileId: file.id
    }));

    // Use the chat context to send the message with streaming
    await sendMessage(message, attachments.length > 0 ? attachments : undefined);
  };

  return (
    <div className="chat-dialog">
      <div className="chat-dialog__messages" ref={messagesContainerRef}>
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
