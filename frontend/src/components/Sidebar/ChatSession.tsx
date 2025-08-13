import React, { useState, useEffect } from 'react';
import { Chat } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useMenu } from '../../contexts/MenuContext';
import { MoreIcon, EditIcon, DeleteIcon } from '../icons';

interface ChatSessionProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (chatId: string) => void;
  onRename: (chatId: string, newTitle: string) => void;
  onDelete: (chatId: string) => void;
}

const ChatSession: React.FC<ChatSessionProps> = ({
  chat,
  isActive,
  onSelect,
  onRename,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  const [menuPositionAbove, setMenuPositionAbove] = useState(false);
  const { activeMenu, setActiveMenu, closeAllMenus } = useMenu();
  
  const menuId = `chat-session-${chat.id}`;
  const chatItemRef = React.useRef<HTMLDivElement>(null);
  const menuRef = useClickOutside<HTMLDivElement>(() => {
    if (showMenu) {
      setShowMenu(false);
      setActiveMenu(null);
    }
  }, showMenu);

  // Close menu when another menu opens
  useEffect(() => {
    if (activeMenu && activeMenu !== menuId && showMenu) {
      setShowMenu(false);
    }
  }, [activeMenu, menuId, showMenu]);

  const calculateMenuPosition = () => {
    if (!chatItemRef.current) return false;
    
    const chatItem = chatItemRef.current;
    const rect = chatItem.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Estimate menu height (based on 2 menu items + padding)
    const menuHeight = 80; // Approximate height for 2 menu items
    const spaceBelow = viewportHeight - rect.bottom;
    
    // If there's insufficient space below, position above
    return spaceBelow < menuHeight;
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showMenu) {
      setShowMenu(false);
      setActiveMenu(null);
      setMenuPositionAbove(false);
    } else {
      closeAllMenus(); // Close other menus first
      
      // Calculate menu position before showing
      const shouldPositionAbove = calculateMenuPosition();
      setMenuPositionAbove(shouldPositionAbove);
      
      setShowMenu(true);
      setActiveMenu(menuId);
    }
  };

  const handleRename = () => {
    setIsRenaming(true);
    setShowMenu(false);
    setActiveMenu(null);
  };

  const handleSaveRename = () => {
    if (newTitle.trim()) {
      onRename(chat.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setNewTitle(chat.title);
    setIsRenaming(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowMenu(false);
    setActiveMenu(null);
  };

  const confirmDelete = () => {
    onDelete(chat.id);
    setShowDeleteModal(false);
  };

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get last message preview
  const lastMessage = chat.messages.length > 0 
    ? chat.messages[chat.messages.length - 1] 
    : null;

  const lastMessagePreview = lastMessage 
    ? lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + '...'
      : lastMessage.content
    : 'No messages yet';

  return (
    <>
      <div
        ref={chatItemRef}
        className={`sidebar__chat-item ${isActive ? 'active' : ''} ${showMenu ? 'menu-open' : ''}`}
        onClick={() => onSelect(chat.id)}
      >
        <div className="sidebar__chat-avatar">
          {getInitials(chat.title)}
        </div>
        
        <div className="sidebar__chat-content">
          {isRenaming ? (
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleSaveRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveRename();
                } else if (e.key === 'Escape') {
                  handleCancelRename();
                }
              }}
              className="sidebar__chat-rename-input"
              autoFocus
            />
          ) : (
            <>
              <div className="sidebar__chat-title">{chat.title}</div>
              <div className="sidebar__chat-preview">{lastMessagePreview}</div>
              <div className="sidebar__chat-date">{formatDate(chat.updatedAt)}</div>
            </>
          )}
        </div>

        <div className="sidebar__chat-actions">
          <button
            className="sidebar__chat-action-btn"
            onClick={handleMenuToggle}
            title="More options"
          >
            <MoreIcon size={16} />
          </button>
        </div>

        {showMenu && (
          <div 
            className={`sidebar__chat-menu ${menuPositionAbove ? 'sidebar__chat-menu--above' : ''}`} 
            ref={menuRef}
          >
            <button
              className="sidebar__chat-menu-item"
              onClick={handleRename}
            >
              <EditIcon size={14} />
              Rename
            </button>
            <button
              className="sidebar__chat-menu-item delete"
              onClick={handleDelete}
            >
              <DeleteIcon size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="sidebar__delete-modal">
          <div className="sidebar__delete-content">
            <div className="sidebar__delete-title">Delete Chat</div>
            <div className="sidebar__delete-message">
              Are you sure you want to delete "{chat.title}"? This action cannot be undone.
            </div>
            <div className="sidebar__delete-actions">
              <button
                className="sidebar__delete-btn sidebar__delete-btn--cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="sidebar__delete-btn sidebar__delete-btn--confirm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSession; 