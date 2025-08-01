import { ChatMessage as ChatMessageType } from "../../types";

const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  return <div>{message.content}</div>;
};

export default ChatMessage;
