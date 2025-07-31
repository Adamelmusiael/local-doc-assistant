import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useChat } from '../../contexts/ChatContext';
import { useUser } from '../../contexts/UserContext';
import ChatSession from './ChatSession';
import './sidebar.scss';

// Icons (you can replace these with actual icon components)
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FilesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: chatState, createChat, selectChat } = useChat();
  const { state: userState, logout } = useUser();
  
  const [isChatsExpanded, setIsChatsExpanded] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNewChat = () => {
    const defaultModel = userState.selectedModel || userState.preferences?.defaultModel || 'mistral';
    createChat('New Chat', defaultModel);
    navigate('/');
  };

  const handleChatSelect = (chatId: string) => {
    // Select the chat in the context
    selectChat(chatId);
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <div className="sidebar">
      {/* Logo/Branding Area */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <ChatIcon />
          </div>
          <h1 className="sidebar__logo-text">AI Assistant</h1>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar__navigation">
        <Link 
          to="/" 
          className={`sidebar__nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <ChatIcon />
          <span>Chat</span>
        </Link>
        
        <Link 
          to="/files" 
          className={`sidebar__nav-item ${location.pathname === '/files' ? 'active' : ''}`}
        >
          <FilesIcon />
          <span>Files</span>
        </Link>
        
        <Link 
          to="/settings" 
          className={`sidebar__nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          <SettingsIcon />
          <span>Settings</span>
        </Link>
      </nav>

      {/* New Chat Button */}
      <div className="sidebar__new-chat">
        <button 
          className="sidebar__new-chat-btn"
          onClick={handleNewChat}
        >
          <PlusIcon />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Sessions List */}
      <div className="sidebar__chats">
        <div 
          className="sidebar__chats-header"
          onClick={() => setIsChatsExpanded(!isChatsExpanded)}
        >
          <span>Chat History</span>
          <ChevronDownIcon className={`sidebar__chevron ${isChatsExpanded ? 'expanded' : ''}`} />
        </div>
        
        {isChatsExpanded && (
          <div className="sidebar__chats-list">
            {chatState.chats.length === 0 ? (
              <div className="sidebar__no-chats">
                <p>No chats yet</p>
                <p>Start a new conversation!</p>
              </div>
            ) : (
              chatState.chats.map((chat) => (
                <ChatSession
                  key={chat.id}
                  chat={chat}
                  isActive={chatState.currentChat?.id === chat.id}
                  onSelect={handleChatSelect}
                  formatDate={formatDate}
                  truncateTitle={truncateTitle}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* User Profile Area */}
      <div className="sidebar__user">
        <div 
          className="sidebar__user-info"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="sidebar__user-avatar">
            {userState.user?.avatar ? (
              <img src={userState.user.avatar} alt={userState.user.name} />
            ) : (
              <UserIcon />
            )}
          </div>
          <div className="sidebar__user-details">
            <h4 className="sidebar__user-name">
              {userState.user?.name || 'Guest User'}
            </h4>
            <p className="sidebar__user-email">
              {userState.user?.email || 'guest@example.com'}
            </p>
          </div>
        </div>
        
                {showUserMenu && (
          <div className="sidebar__user-menu show">
            <button 
              className="sidebar__user-menu-item"
              onClick={() => {
                navigate('/settings');
                setShowUserMenu(false);
              }}
            >
              Settings
            </button>
            <button 
              className="sidebar__user-menu-item sidebar__user-menu-item--logout"
              onClick={() => {
                logout();
                setShowUserMenu(false);
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
