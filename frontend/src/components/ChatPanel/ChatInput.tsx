import React, { useState, useRef, useEffect } from 'react';
import { SearchMode } from '../../types';
import { useChat } from '../../contexts/ChatContext';
import { useFile } from '../../contexts/FileContext';
import { useConfidentialityValidation } from '../../hooks/useConfidentialityValidation';
import FileSelectionModal from './FileSelectionModal';
import ConfidentialFileWarningModal from './ConfidentialFileWarningModal';
import { SendIcon, AttachIcon, LoadingIcon, SecurityIcon, BlockIcon } from '../icons';
import './ChatInput.scss';

interface ChatInputProps {
  selectedModel: string;
  searchMode: SearchMode;
  onSendMessage?: (message: string, model: string, searchMode: SearchMode, attachments?: File[]) => void;
  isLoading?: boolean;
  maxLength?: number;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  selectedModel, 
  searchMode, 
  onSendMessage,
  isLoading = false,
  maxLength = 4000
}) => {
  const [message, setMessage] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [userHasConfirmedFiles, setUserHasConfirmedFiles] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { state: chatState, removeSelectedFile } = useChat();
  const { state: fileState } = useFile();
  const validation = useConfidentialityValidation(selectedModel);

  // Normal send logic - simplified since confirmation happens earlier
  const canSend = message.trim() && !isLoading;

  // Get selected files info for display
  const selectedFiles = fileState.files.filter(file => 
    chatState.selectedFiles.includes(file.id)
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple send logic - no confirmation needed here since it happens earlier
    if (canSend && onSendMessage) {
      onSendMessage(message.trim(), selectedModel, searchMode);
      setMessage('');
    }
  };

  const handleConfirmSend = () => {
    setShowConfirmationModal(false);
    // Mark these specific files as confirmed for this model
    const fileKey = `${selectedModel}-${validation.confidentialFileNames.join(',')}`;
    setUserHasConfirmedFiles(prev => new Set([...prev, fileKey]));
  };

  const handleCancelSend = () => {
    setShowConfirmationModal(false);
    // Remove all confidential files from selection
    const confidentialFiles = selectedFiles.filter(file => 
      file.isConfidential && validation.confidentialFileNames.includes(file.originalName)
    );
    
    confidentialFiles.forEach(file => {
      removeSelectedFile(file.id);
    });
  };

  // Show modal automatically when validation detects the need for confirmation
  useEffect(() => {
    if (validation.shouldShowModal && !showConfirmationModal && validation.confidentialFileNames.length > 0) {
      const fileKey = `${selectedModel}-${validation.confidentialFileNames.join(',')}`;
      // Only show modal if user hasn't already confirmed this combination
      if (!userHasConfirmedFiles.has(fileKey)) {
        setShowConfirmationModal(true);
      }
    }
  }, [validation.shouldShowModal, selectedModel, validation.confidentialFileNames, showConfirmationModal, userHasConfirmedFiles]);

  // Reset confirmed files when model changes or files change
  useEffect(() => {
    setUserHasConfirmedFiles(new Set());
  }, [selectedModel, chatState.selectedFiles]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleAttachClick = () => {
    setShowFileModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="chat-input">
      <form onSubmit={handleSubmit} className="chat-input__form">
        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="chat-input__attachments">
            {selectedFiles.map((file) => (
              <div key={file.id} className="chat-input__attachment">
                {file.isConfidential && <SecurityIcon />}
                <span className="chat-input__attachment-name">{file.originalName}</span>
                <span className="chat-input__attachment-size">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeSelectedFile(file.id)}
                  className="chat-input__attachment-remove"
                  title="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Confidentiality Warning - removed since we show modal immediately */}

        {/* Block Message - only show if not a confirmation case */}
        {validation.blockedReason && !validation.needsConfirmation && (
          <div className="chat-input__error">
            <BlockIcon />
            <span className="chat-input__error-text">{validation.blockedReason}</span>
          </div>
        )}

        {/* Input Container */}
        <div className="chat-input__container">
          <button 
            type="button" 
            className="chat-input__attach-btn"
            title="Select files to attach"
            disabled={isLoading}
            onClick={handleAttachClick}
          >
            <AttachIcon />
          </button>
          
          <div className="chat-input__textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input__textarea"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              maxLength={maxLength}
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="chat-input__send-btn"
            disabled={!canSend}
            title={isLoading ? 'Sending...' : 'Send message'}
          >
            {isLoading ? <LoadingIcon /> : <SendIcon />}
          </button>
        </div>
      </form>

      {/* File Selection Modal */}
      <FileSelectionModal 
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
      />

      {/* Confidential File Warning Modal */}
      <ConfidentialFileWarningModal
        isOpen={showConfirmationModal}
        confidentialFiles={validation.confidentialFileNames}
        modelName={selectedModel}
        onConfirm={handleConfirmSend}
        onCancel={handleCancelSend}
      />
    </div>
  );
};

export default ChatInput;
