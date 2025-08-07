import { useState } from "react";
import ChatDialog from "../components/ChatPanel/ChatDialog";
import Layout from "../components/Layout/Layout";
import ChatHeader from "../components/ChatPanel/ChatHeader";
import "./chat.scss";
import { SearchMode } from "../types";
import { useModels } from "../hooks/useModels";
import { useChat } from "../contexts/ChatContext";

interface ChatProps {
  onToggleSidebar?: () => void;
}

const Chat: React.FC<ChatProps> = ({ onToggleSidebar }) => {
  const { models, defaultModel } = useModels();
  const { state: chatState, updateSessionModel } = useChat();
  const [searchMode, setSearchMode] = useState<SearchMode>(SearchMode.SELECTED);

  // Get current session's model or use default
  const currentSessionModel = chatState.currentChat?.model || defaultModel;

  const handleModelChange = async (modelId: string) => {
    if (chatState.currentChat && modelId !== chatState.currentChat.model) {
      try {
        await updateSessionModel(chatState.currentChat.id, modelId);
      } catch (error) {
        console.error('Failed to update session model:', error);
        // Error handling is done in the context (auto-revert + error message)
      }
    }
  };

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
  };

  return (
    <Layout>
      <div className="chat-container">
        {/* Error notification */}
        {chatState.error && (
          <div className="chat-error-notification">
            <span>{chatState.error}</span>
          </div>
        )}
        
        <div className="chat-main">
          <ChatHeader 
            selectedModel={currentSessionModel}
            onModelChange={handleModelChange}
            searchMode={searchMode}
            onSearchModeChange={handleSearchModeChange}
            models={models}
            onToggleSidebar={onToggleSidebar || (() => {})}
          />
          <ChatDialog 
            selectedModel={currentSessionModel}
            searchMode={searchMode}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
