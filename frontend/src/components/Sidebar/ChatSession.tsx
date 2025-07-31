import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Chat } from '../../types';
import { useChat } from '../../contexts/ChatContext';

// Icons
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);

interface ChatSessionProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (chatId: string) => void;
  formatDate: (dateString: string) => string;
  truncateTitle: (title: string, maxLength?: number) => string;
}

const ChatSession: React.FC<ChatSessionProps> = ({
  chat,
  isActive,
  onSelect,
  formatDate,
  truncateTitle,
}) => {
  const { deleteChat, updateChat } = useChat();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get last message preview
  const lastMessage = chat.messages.length > 0 
    ? chat.messages[chat.messages.length - 1] 
    : null;

  const lastMessagePreview = lastMessage 
    ? truncateTitle(lastMessage.content, 50)
    : 'No messages yet';

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditTitle(chat.title);
    setShowMenu(false);
  };

  const handleEditSave = () => {
    if (editTitle.trim() && editTitle.trim() !== chat.title) {
      updateChat(chat.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle(chat.title);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDelete = () => {
    deleteChat(chat.id);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      className={`sidebar__chat-item ${isActive ? 'active' : ''} ${showMenu ? 'menu-open' : ''}`}
      onClick={() => onSelect(chat.id)}
    >
      <div className="sidebar__chat-info">
        {isEditing ? (
          <div className="sidebar__chat-edit">
            <input
              ref={editInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleEditSave}
              className="sidebar__chat-edit-input"
              maxLength={50}
            />
          </div>
        ) : (
          <>
            <h4 className="sidebar__chat-title">
              {truncateTitle(chat.title)}
            </h4>
            <p className="sidebar__chat-preview">
              {lastMessagePreview}
            </p>
            <p className="sidebar__chat-date">
              {formatDate(chat.updatedAt)}
            </p>
          </>
        )}
      </div>

      <div className="sidebar__chat-meta">
        <span className="sidebar__chat-model">{chat.model}</span>
        {chat.messages.length > 0 && (
          <span className="sidebar__chat-messages">
            {chat.messages.length} messages
          </span>
        )}
        
        {!isEditing && (
          <div className="sidebar__chat-actions" ref={menuRef}>
            <button
              className="sidebar__chat-action-btn"
              onClick={handleMenuToggle}
              title="More options"
            >
              <MoreIcon />
            </button>
            
                        {showMenu && (
              <div className="sidebar__chat-menu show">
                <button
                  className="sidebar__chat-menu-item"
                  onClick={handleEditStart}
                >
                  <EditIcon />
                  <span>Rename</span>
                </button>
                <button
                  className="sidebar__chat-menu-item sidebar__chat-menu-item--delete"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <DeleteIcon />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div className="sidebar__delete-modal">
          <div className="sidebar__delete-modal-content">
            <h4>Delete Chat</h4>
            <p>Are you sure you want to delete "{chat.title}"? This action cannot be undone.</p>
            <div className="sidebar__delete-modal-actions">
              <button
                className="sidebar__delete-modal-btn sidebar__delete-modal-btn--cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="sidebar__delete-modal-btn sidebar__delete-modal-btn--delete"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ChatSession; 