import ChatInput from "./ChatInput";
import "./ChatDialog.scss";
import { useState } from "react";
import ChatMessage from "./ChatMessage";
import { ChatMessage as ChatMessageType, SearchMode } from "../../types";
import { mockMessages, simulateChatResponse } from "../../mock/chatMocks";

interface ChatDialogProps {
  selectedModel: string;
  searchMode: SearchMode;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ selectedModel, searchMode }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>(mockMessages);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string, model: string, searchMode: SearchMode, attachments?: File[]) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
      attachments: attachments?.map((file, index) => ({
        id: `att_${Date.now()}_${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        fileId: `file_${Date.now()}_${index}`
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const assistantMessage = await simulateChatResponse(message, model, searchMode, attachments);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat response failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-dialog">
      <div className="chat-dialog__messages">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message}
          />
        ))}
      </div>
      <ChatInput 
        selectedModel={selectedModel}
        searchMode={searchMode}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        maxLength={4000}
      />
    </div>
  );
};

export default ChatDialog;
