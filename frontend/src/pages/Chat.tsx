import { useState } from "react";
import ChatDialog from "../components/ChatPanel/ChatDialog";
import Layout from "../components/Layout/Layout";
import ChatHeader from "../components/ChatPanel/ChatHeader";
import "./chat.scss";
import { SearchMode } from "../types";
import { mockModels } from "../mock/chatMocks";

interface ChatProps {
  onToggleSidebar?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onToggleSidebar }) => {
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.SELECTED);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
  };

  return (
    <Layout>
      <div className="chat-container">
        <div className="chat-main">
          <ChatHeader 
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            searchMode={searchMode}
            onSearchModeChange={handleSearchModeChange}
            models={mockModels}
            onToggleSidebar={onToggleSidebar || (() => {})}
          />
          <ChatDialog 
            selectedModel={selectedModel}
            searchMode={searchMode}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
