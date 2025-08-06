import { useState, useEffect } from "react";
import ChatDialog from "../components/ChatPanel/ChatDialog";
import Layout from "../components/Layout/Layout";
import ChatHeader from "../components/ChatPanel/ChatHeader";
import "./chat.scss";
import { SearchMode } from "../types";
import { useModels } from "../hooks/useModels";

interface ChatProps {
  onToggleSidebar?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onToggleSidebar }) => {
  const { models, loading, defaultModel } = useModels();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.SELECTED);

  // Set default model when models are loaded
  useEffect(() => {
    if (!loading && models.length > 0 && !selectedModel) {
      setSelectedModel(defaultModel);
    }
  }, [models, loading, defaultModel, selectedModel]);

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
            models={models}
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
