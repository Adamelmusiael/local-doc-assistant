import React, { useState, useRef, useEffect } from 'react';
import { SearchMode } from '../../types';
import { useChat } from '../../contexts/ChatContext';
import { useFile } from '../../contexts/FileContext';
import FileSelectionModal from './FileSelectionModal';

// Icons
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9"/>
  </svg>
);

const AttachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const LoadingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
      <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
    </circle>
  </svg>
);

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { state: chatState } = useChat();
  const { state: fileState } = useFile();

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
    if (canSend && onSendMessage) {
      onSendMessage(message.trim(), selectedModel, searchMode);
      setMessage('');
    }
  };

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
                <span className="chat-input__attachment-name">{file.originalName}</span>
                <span className="chat-input__attachment-size">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => {/* Remove handled by modal */}}
                  className="chat-input__attachment-remove"
                  title="Remove attachment"
                >
                  ×
                </button>
              </div>
            ))}
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
    </div>
  );
};

export default ChatInput;
