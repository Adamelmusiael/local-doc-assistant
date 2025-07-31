import ChatInput from "./ChatInput";
import "./ChatDialog.scss";
import { useState } from "react";
import ChatMessage from "./ChatMessage";
import { ChatMessage as ChatMessageType, SearchMode } from "../../types";

const mockMessages: ChatMessageType[] = [
  {
    id: "1",
    content: "Hello, how are you?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    content: "I am fine, thank you! I can help you with various tasks including answering questions, analyzing documents, and providing insights based on your uploaded files.",
    role: "assistant",
    timestamp: new Date().toISOString(),
    sources: ["document1.pdf", "document2.pdf"],
  },
  {
    id: "3",
    content: "Can you analyze the attached files?",
    role: "user",
    timestamp: new Date().toISOString(),
    attachments: [
      {
        id: "file1",
        name: "analysis.pdf",
        type: "application/pdf",
        size: 1024000,
        fileId: "file1"
      }
    ]
  },
];

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

    // Simulate API call
    setTimeout(() => {
      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: `I've received your message: "${message}" and I'm processing it with model ${model} in ${searchMode} mode.${attachments && attachments.length > 0 ? ` I can see you've attached ${attachments.length} file(s).` : ''}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sources: attachments && attachments.length > 0 ? attachments.map(f => f.name) : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
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
