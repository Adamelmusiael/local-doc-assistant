import React, { useState, useEffect } from 'react';
import { Model, SearchMode } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useMenu } from '../../contexts/MenuContext';
import { MenuIcon, ChevronDownIcon } from '../icons';

interface ChatHeaderProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  models: Model[];
  onToggleSidebar: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedModel,
  onModelChange,
  searchMode,
  onSearchModeChange,
  models,
  onToggleSidebar,
}) => {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showSearchModeDropdown, setShowSearchModeDropdown] = useState(false);
  const { activeMenu, setActiveMenu, closeAllMenus } = useMenu();

  const modelMenuId = 'chat-header-model';
  const searchModeMenuId = 'chat-header-search-mode';

  const modelDropdownRef = useClickOutside<HTMLDivElement>(() => {
    if (showModelDropdown) {
      setShowModelDropdown(false);
      setActiveMenu(null);
    }
  }, showModelDropdown);

  const searchModeDropdownRef = useClickOutside<HTMLDivElement>(() => {
    if (showSearchModeDropdown) {
      setShowSearchModeDropdown(false);
      setActiveMenu(null);
    }
  }, showSearchModeDropdown);

  // Close dropdowns when another menu opens
  useEffect(() => {
    if (activeMenu && activeMenu !== modelMenuId && showModelDropdown) {
      setShowModelDropdown(false);
    }
    if (activeMenu && activeMenu !== searchModeMenuId && showSearchModeDropdown) {
      setShowSearchModeDropdown(false);
    }
  }, [activeMenu, showModelDropdown, showSearchModeDropdown]);

  const selectedModelData = models.find(model => model.id === selectedModel);

  const searchModeLabels = {
    [SearchMode.SELECTED]: "Selected Only",
    [SearchMode.HYBRID]: "Hybrid",
    [SearchMode.ALL]: "All Files"
  };

  const handleModelDropdownToggle = () => {
    if (showModelDropdown) {
      setShowModelDropdown(false);
      setActiveMenu(null);
    } else {
      closeAllMenus();
      setShowModelDropdown(true);
      setActiveMenu(modelMenuId);
    }
  };

  const handleSearchModeDropdownToggle = () => {
    if (showSearchModeDropdown) {
      setShowSearchModeDropdown(false);
      setActiveMenu(null);
    } else {
      closeAllMenus();
      setShowSearchModeDropdown(true);
      setActiveMenu(searchModeMenuId);
    }
  };

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setShowModelDropdown(false);
    setActiveMenu(null);
  };

  const handleSearchModeSelect = (mode: SearchMode) => {
    onSearchModeChange(mode);
    setShowSearchModeDropdown(false);
    setActiveMenu(null);
  };

  return (
    <header className="chat-header">
      <div className="chat-header__left">
        <button 
          className="chat-header__menu-btn"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          <MenuIcon size={20} />
        </button>
        
        <div className="chat-header__model-selector">
          <button
            className="chat-header__model-btn"
            onClick={handleModelDropdownToggle}
          >
            <span className="chat-header__model-name">
              {selectedModelData?.name || "Select Model"}
            </span>
            <ChevronDownIcon size={16} />
          </button>
          
          {showModelDropdown && (
            <div className="chat-header__dropdown chat-header__model-dropdown" ref={modelDropdownRef}>
              {models.map((model) => (
                <button
                  key={model.id}
                  className={`chat-header__dropdown-item ${model.id === selectedModel ? 'active' : ''}`}
                  onClick={() => handleModelSelect(model.id)}
                >
                  <div className="chat-header__model-info">
                    <span className="chat-header__model-name">{model.name}</span>
                    <span className="chat-header__model-description">{model.description}</span>
                  </div>
                  {model.default && (
                    <span className="chat-header__model-default">Default</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chat-header__search-mode">
          <button
            className="chat-header__search-mode-btn"
            onClick={handleSearchModeDropdownToggle}
          >
            <span>{searchModeLabels[searchMode]}</span>
            <ChevronDownIcon size={16} />
          </button>
          
          {showSearchModeDropdown && (
            <div className="chat-header__dropdown chat-header__search-mode-dropdown" ref={searchModeDropdownRef}>
              {Object.entries(searchModeLabels).map(([mode, label]) => (
                <button
                  key={mode}
                  className={`chat-header__dropdown-item ${mode === searchMode ? 'active' : ''}`}
                  onClick={() => handleSearchModeSelect(mode as SearchMode)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings button removed as requested */}
      {/*
      <div className="chat-header__right">
        <button className="chat-header__settings-btn" title="Settings">
          <SettingsIcon />
        </button>
      </div>
      */}
    </header>
  );
};

export default ChatHeader;
