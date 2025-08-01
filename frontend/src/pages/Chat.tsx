import ChatDialog from "../components/ChatPanel/ChatDialog";
import Sidebar from "../components/Sidebar/Sidebar";
import "./chat.scss";

const Chat = () => {
  return (
    <div className="chat-container">
      <Sidebar />
      <ChatDialog />
    </div>
  );
};

export default Chat;
