import { useState } from "react";
import ChatDialog from "../components/ChatPanel/ChatDialog";
import Layout from "../components/Layout/Layout";
import ChatHeader from "../components/ChatPanel/ChatHeader";
import "./chat.scss";
import { Model, SearchMode } from "../types";

// Mock models for demonstration
const mockModels: Model[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Most capable model for complex tasks",
    provider: "OpenAI",
    maxTokens: 8192,
    isAvailable: true,
    default: true,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and efficient for most tasks",
    provider: "OpenAI",
    maxTokens: 4096,
    isAvailable: true,
  },
  {
    id: "claude-3",
    name: "Claude 3",
    description: "Anthropic's latest model",
    provider: "Anthropic",
    maxTokens: 100000,
    isAvailable: true,
  },
];

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
