import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import { formatTimestamp } from '../../utils/dateUtils';
import { CopyIcon, ResourcesIcon, FileIcon } from '../icons';
import './ChatMessage.scss';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const isUser = message.role === 'user';
  const hasSources = message.sources && message.sources.length > 0;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasError = message.status === 'error' && message.error;
  const isStreaming = message.status === 'streaming' || message.isGenerating;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleRetry = () => {
    // TODO: Implement retry functionality
    console.log('Retry message:', message.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIndicator = () => {
    switch (message.status) {
      case 'pending':
        return <span className="chat-message__status chat-message__status--pending">●</span>;
      case 'sending':
        return <span className="chat-message__status chat-message__status--sending">⏳</span>;
      case 'sent':
        return <span className="chat-message__status chat-message__status--sent">✓</span>;
      case 'streaming':
        return <span className="chat-message__status chat-message__status--streaming">⚡</span>;
      case 'completed':
        return <span className="chat-message__status chat-message__status--completed">✓</span>;
      case 'error':
        return <span className="chat-message__status chat-message__status--error">⚠</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      <div className="chat-message__bubble">
        <div className="chat-message__header">
          <span className="chat-message__role">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="chat-message__timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
          {getStatusIndicator()}
        </div>

        <div className="chat-message__body">
          <div className="chat-message__text">
            {message.content}
            {isStreaming && (
              <span className="chat-message__typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
            )}
          </div>
        </div>

        {/* File Attachments */}
        {hasAttachments && (
          <div className="chat-message__attachments">
            <h4 className="chat-message__attachments-title">Attached Files:</h4>
            <div className="chat-message__attachments-list">
              {message.attachments!.map((attachment) => (
                <div key={attachment.id} className="chat-message__attachment">
                  <FileIcon size={16} />
                  <div className="chat-message__attachment-info">
                    <span className="chat-message__attachment-name">{attachment.name}</span>
                    <span className="chat-message__attachment-size">{formatFileSize(attachment.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Actions */}
        <div className="chat-message__actions">
          <button
            onClick={handleCopy}
            className="chat-message__action-btn"
            title="Copy message"
          >
            <CopyIcon size={16} />
            {copySuccess && <span className="chat-message__copy-success">Copied!</span>}
          </button>
          
          {/* Resources Icon - only show for assistant messages with sources */}
          {!isUser && hasSources && (
            <button
              onClick={() => setShowSources(!showSources)}
              className="chat-message__action-btn chat-message__action-btn--resources"
              title={`${message.sources!.length} source${message.sources!.length > 1 ? 's' : ''} used`}
            >
              <ResourcesIcon size={16} />
              <span className="chat-message__resources-count">{message.sources!.length}</span>
            </button>
          )}
        </div>

        {/* Source Citations - shown when resources icon is clicked */}
        {!isUser && hasSources && showSources && (
          <div className="chat-message__sources">
            <div className="chat-message__sources-header">
              <span>Sources used:</span>
              <button
                className="chat-message__sources-close"
                onClick={() => setShowSources(false)}
              >
                ×
              </button>
            </div>
            <div className="chat-message__sources-list">
              {message.sources!.map((source, index) => (
                <div key={index} className="chat-message__source">
                  <span className="chat-message__source-number">{index + 1}</span>
                  <span className="chat-message__source-text">{source}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div className="chat-message__error">
            <div className="chat-message__error-content">
              <span className="chat-message__error-icon">⚠️</span>
              <div className="chat-message__error-text">
                <div className="chat-message__error-title">Error</div>
                <div className="chat-message__error-message">{message.error!.message}</div>
              </div>
              {message.error!.retryable && (
                <button 
                  className="chat-message__error-retry"
                  onClick={handleRetry}
                  title="Retry sending message"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
