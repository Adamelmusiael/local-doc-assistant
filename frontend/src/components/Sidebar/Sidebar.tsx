import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useChat } from '../../contexts/ChatContext';
import ChatSession from './ChatSession';
import BackendStatusIndicator from '../BackendStatusIndicator';
import { APP_VERSION } from '../../config/version';
import { ChatIcon, FilesIcon, PlusIcon, ChevronDownIcon } from '../icons';
import './sidebar.scss';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: chatState, createChat, selectChat, deleteChat, updateChat } = useChat();
  
  const [isChatsExpanded, setIsChatsExpanded] = useState(true);

  const handleNewChat = async () => {
    try {
      // Create new chat without specifying model - backend will use default from .config
      await createChat('New Chat');
      navigate('/');
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleChatSelect = (chatId: string) => {
    // Select the chat in the context
    selectChat(chatId);
    navigate('/');
  };

  const handleChatRename = async (chatId: string, newTitle: string) => {
    try {
      await updateChat(chatId, { title: newTitle });
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const handleChatDelete = async (chatId: string) => {
    try {
      await deleteChat(chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  return (
    <div className="sidebar">
      {/* Logo/Branding Area */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-content">
            <h1 className="sidebar__logo-text">NoA Aia</h1>
            <div className="sidebar__version">{APP_VERSION}</div>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="sidebar__new-chat">
        <button 
          className="sidebar__new-chat-btn"
          onClick={handleNewChat}
        >
          <PlusIcon size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar__nav">
        <Link 
          to="/" 
          className={`sidebar__nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <ChatIcon size={20} />
          <span>Chat</span>
        </Link>
        
        <Link 
          to="/files" 
          className={`sidebar__nav-item ${location.pathname === '/files' ? 'active' : ''}`}
        >
          <FilesIcon size={20} />
          <span>Files</span>
        </Link>
        
        <div className="sidebar__nav-item sidebar__nav-item--status">
          <BackendStatusIndicator size="medium" />
          <span>Backend Status</span>
        </div>
      </nav>

      {/* Chat Sessions List */}
      <div className="sidebar__chats">
        <div 
          className="sidebar__chats-header"
          onClick={() => setIsChatsExpanded(!isChatsExpanded)}
        >
          <span className="sidebar__chats-title">Chat History</span>
          <button className={`sidebar__chats-toggle ${isChatsExpanded ? 'expanded' : ''}`}>
            <ChevronDownIcon size={16} />
          </button>
        </div>
        
        {isChatsExpanded && (
          <div className="sidebar__chats-list">
            {chatState.isLoading ? (
              <div className="sidebar__no-chats">
                <p>Loading chats...</p>
              </div>
            ) : chatState.error ? (
              <div className="sidebar__no-chats">
                <p>Error loading chats</p>
                <p>{chatState.error}</p>
              </div>
            ) : chatState.chats.length === 0 ? (
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
                  onRename={handleChatRename}
                  onDelete={handleChatDelete}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* User Profile Area - Removed as requested */}
      {/* 
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
          <div className="sidebar__user-menu">
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
      */}
    </div>
  );
};

export default Sidebar;
