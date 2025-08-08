import React, { useState, useEffect } from 'react';
import { Model } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useMenu } from '../../contexts/MenuContext';

// Icons
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showInfo?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  className = '',
  size = 'medium',
  showInfo = true
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState<string | null>(null);
  const { activeMenu, setActiveMenu, closeAllMenus } = useMenu();
  
  const menuId = `model-selector-${Math.random()}`;
  const dropdownRef = useClickOutside<HTMLDivElement>(() => {
    if (showDropdown) {
      setShowDropdown(false);
      setActiveMenu(null);
    }
  }, showDropdown);
  
  const infoRef = useClickOutside<HTMLDivElement>(() => {
    if (showModelInfo) {
      setShowModelInfo(null);
    }
  }, !!showModelInfo);

  // Close dropdown when another menu opens
  useEffect(() => {
    if (activeMenu && activeMenu !== menuId && showDropdown) {
      setShowDropdown(false);
    }
  }, [activeMenu, menuId, showDropdown]);

  const selectedModelData = models.find(model => model.id === selectedModel);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setShowDropdown(false);
    setActiveMenu(null);
  };

  const handleDropdownToggle = () => {
    if (showDropdown) {
      setShowDropdown(false);
      setActiveMenu(null);
    } else {
      closeAllMenus(); // Close other menus first
      setShowDropdown(true);
      setActiveMenu(menuId);
    }
  };

  const handleInfoToggle = () => {
    const newInfoState = showModelInfo === selectedModel ? null : selectedModel;
    setShowModelInfo(newInfoState);
  };

  const getModelStatus = (model: Model) => {
    if (!model.isAvailable) return 'unavailable';
    if (model.id === selectedModel) return 'selected';
    return 'available';
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return tokens.toString();
  };

  return (
    <div className={`model-selector ${className} model-selector--${size}`}>
      <div className="model-selector__main">
        <button
          className="model-selector__button"
          onClick={handleDropdownToggle}
          disabled={models.length === 0}
        >
          <div className="model-selector__selected">
            <span className="model-selector__name">
              {selectedModelData?.name || 'Select Model'}
            </span>
            {selectedModelData && (
              <span className="model-selector__provider">
                {selectedModelData.provider}
              </span>
            )}
          </div>
          <ChevronDownIcon className={`model-selector__chevron ${showDropdown ? 'expanded' : ''}`} />
        </button>

        {showInfo && selectedModelData && (
          <button
            className="model-selector__info-btn"
            onClick={handleInfoToggle}
            title="Model information"
          >
            <InfoIcon />
          </button>
        )}
      </div>

      {/* Model Info Popup */}
      {showModelInfo && selectedModelData && (
        <div className="model-selector__info-popup" ref={infoRef}>
          <div className="model-selector__info-header">
            <h4>{selectedModelData.name}</h4>
            <button
              onClick={() => setShowModelInfo(null)}
              className="model-selector__info-close"
            >
              ×
            </button>
          </div>
          <div className="model-selector__info-content">
            <p className="model-selector__info-description">
              {selectedModelData.description}
            </p>
            <div className="model-selector__info-details">
              <div className="model-selector__info-detail">
                <span className="model-selector__info-label">Provider:</span>
                <span className="model-selector__info-value">{selectedModelData.provider}</span>
              </div>
              <div className="model-selector__info-detail">
                <span className="model-selector__info-label">Max Tokens:</span>
                <span className="model-selector__info-value">{formatTokens(selectedModelData.maxTokens)}</span>
              </div>
              <div className="model-selector__info-detail">
                <span className="model-selector__info-label">Status:</span>
                <span className={`model-selector__info-status model-selector__info-status--${selectedModelData.isAvailable ? 'available' : 'unavailable'}`}>
                  {selectedModelData.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="model-selector__dropdown" ref={dropdownRef}>
          <div className="model-selector__dropdown-header">
            <h4>Select Model</h4>
          </div>
          <div className="model-selector__dropdown-list">
            {models.map((model) => {
              const status = getModelStatus(model);
              return (
                <button
                  key={model.id}
                  className={`model-selector__dropdown-item model-selector__dropdown-item--${status}`}
                  onClick={() => handleModelSelect(model.id)}
                  disabled={!model.isAvailable}
                >
                  <div className="model-selector__dropdown-item-content">
                    <div className="model-selector__dropdown-item-header">
                      <span className="model-selector__dropdown-item-name">
                        {model.name}
                      </span>
                      {model.default && (
                        <span className="model-selector__dropdown-item-default">Default</span>
                      )}
                      {status === 'selected' && (
                        <CheckIcon className="model-selector__dropdown-item-check" />
                      )}
                    </div>
                    <div className="model-selector__dropdown-item-details">
                      <span className="model-selector__dropdown-item-provider">
                        {model.provider}
                      </span>
                      <span className="model-selector__dropdown-item-tokens">
                        {formatTokens(model.maxTokens)} tokens
                      </span>
                    </div>
                    <p className="model-selector__dropdown-item-description">
                      {model.description}
                    </p>
                  </div>
                  {!model.isAvailable && (
                    <span className="model-selector__dropdown-item-unavailable">
                      Unavailable
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 