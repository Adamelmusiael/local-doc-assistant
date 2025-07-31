import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import "./ChatDialog.scss";
import { useState } from "react";
import ChatMessage from "./ChatMessage";
import { ChatMessage as ChatMessageType } from "../../types";

const mockMessages: ChatMessageType[] = [
  {
    id: "1",
    content: "Hello, how are you?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    content: "I am fine, thank you!",
    role: "assistant",
    timestamp: new Date().toISOString(),
  },
];

const ChatDialog = () => {
  const [messages] = useState<ChatMessageType[]>(mockMessages);

  return (
    <div className="chat-dialog">
      <ChatHeader />
      <div className="chat-dialog__messages">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <ChatInput />
    </div>
  );
};

export default ChatDialog;
