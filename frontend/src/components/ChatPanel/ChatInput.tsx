import React, { useState, useRef, useEffect } from 'react';
import { SearchMode } from '../../types';

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
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = message.trim() && !isLoading;

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
      onSendMessage(message.trim(), selectedModel, searchMode, attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="chat-input__attachments">
            {attachments.map((file, index) => (
              <div key={index} className="chat-input__attachment">
                <span className="chat-input__attachment-name">{file.name}</span>
                <span className="chat-input__attachment-size">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="chat-input__attachment-remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Container */}
        <div className="chat-input__container">
          <label className="chat-input__file-label">
            <input
              type="file"
              multiple
              onChange={handleFileAttach}
              className="chat-input__file-input"
              disabled={isLoading}
            />
            <button 
              type="button" 
              className="chat-input__attach-btn"
              title="Attach files"
              disabled={isLoading}
            >
              <AttachIcon />
            </button>
          </label>
          
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
    </div>
  );
};

export default ChatInput;
