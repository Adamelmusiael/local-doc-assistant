import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Chat, ChatMessage, SearchMode } from '../types';

// State interface for chat context
interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  searchMode: SearchMode;
  selectedFiles: string[];
}

// Action types for chat context
type ChatAction =
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'ADD_CHAT'; payload: Chat }
  | { type: 'UPDATE_CHAT'; payload: Chat }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'SET_CURRENT_CHAT'; payload: Chat | null }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: ChatMessage } }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; messageId: string; message: ChatMessage } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_MODE'; payload: SearchMode }
  | { type: 'SET_SELECTED_FILES'; payload: string[] }
  | { type: 'ADD_SELECTED_FILE'; payload: string }
  | { type: 'REMOVE_SELECTED_FILE'; payload: string };

// Initial state
const initialState: ChatState = {
  chats: [
    {
      id: '1',
      title: 'Project Discussion',
      messages: [
        {
          id: '1',
          content: 'Hello! I need help with my React project.',
          role: 'user',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          content: 'I\'d be happy to help you with your React project! What specific issues are you facing?',
          role: 'assistant',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
        }
      ],
      model: 'mistral',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3500000).toISOString(),
      isActive: true,
    },
    {
      id: '2',
      title: 'Code Review',
      messages: [
        {
          id: '3',
          content: 'Can you review this TypeScript code?',
          role: 'user',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        }
      ],
      model: 'gpt-4',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      isActive: true,
    },
    {
      id: '3',
      title: 'API Integration',
      messages: [],
      model: 'claude',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      isActive: true,
    }
  ],
  currentChat: null,
  isLoading: false,
  error: null,
  searchMode: SearchMode.ALL,
  selectedFiles: [],
};

// Reducer function
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    
    case 'ADD_CHAT':
      return { 
        ...state, 
        chats: [action.payload, ...state.chats],
        currentChat: action.payload 
      };
    
    case 'UPDATE_CHAT':
      return {
        ...state,
        chats: state.chats.map(chat => 
          chat.id === action.payload.id ? action.payload : chat
        ),
        currentChat: state.currentChat?.id === action.payload.id 
          ? action.payload 
          : state.currentChat
      };
    
    case 'DELETE_CHAT':
      return {
        ...state,
        chats: state.chats.filter(chat => chat.id !== action.payload),
        currentChat: state.currentChat?.id === action.payload 
          ? (state.chats[0] || null)
          : state.currentChat
      };
    
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat => {
          if (chat.id === action.payload.chatId) {
            return {
              ...chat,
              messages: [...chat.messages, action.payload.message],
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        }),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: [...state.currentChat.messages, action.payload.message],
              updatedAt: new Date().toISOString()
            }
          : state.currentChat
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat => {
          if (chat.id === action.payload.chatId) {
            return {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.id === action.payload.messageId 
                  ? action.payload.message 
                  : msg
              )
            };
          }
          return chat;
        }),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: state.currentChat.messages.map(msg => 
                msg.id === action.payload.messageId 
                  ? action.payload.message 
                  : msg
              )
            }
          : state.currentChat
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_SEARCH_MODE':
      return { ...state, searchMode: action.payload };
    
    case 'SET_SELECTED_FILES':
      return { ...state, selectedFiles: action.payload };
    
    case 'ADD_SELECTED_FILE':
      return { 
        ...state, 
        selectedFiles: [...state.selectedFiles, action.payload] 
      };
    
    case 'REMOVE_SELECTED_FILE':
      return { 
        ...state, 
        selectedFiles: state.selectedFiles.filter(id => id !== action.payload) 
      };
    
    default:
      return state;
  }
};

// Context interface
interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  // Convenience methods
  createChat: (title: string, model: string) => void;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteChat: (chatId: string) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  setSearchMode: (mode: SearchMode) => void;
  addSelectedFile: (fileId: string) => void;
  removeSelectedFile: (fileId: string) => void;
  clearSelectedFiles: () => void;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Convenience methods
  const createChat = (title: string, model: string) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title,
      messages: [],
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    dispatch({ type: 'ADD_CHAT', payload: newChat });
  };

  const selectChat = (chatId: string) => {
    const chat = state.chats.find(c => c.id === chatId);
    dispatch({ type: 'SET_CURRENT_CHAT', payload: chat || null });
  };

  const sendMessage = (content: string) => {
    if (!state.currentChat) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      attachments: state.selectedFiles.length > 0 
        ? state.selectedFiles.map(fileId => ({
            id: Date.now().toString(),
            name: 'Attached file',
            type: 'file',
            size: 0,
            fileId
          }))
        : undefined,
    };

    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { chatId: state.currentChat.id, message: userMessage } 
    });
    
    // Clear selected files after sending
    dispatch({ type: 'SET_SELECTED_FILES', payload: [] });
  };

  const updateMessage = (messageId: string, content: string) => {
    if (!state.currentChat) return;

    const updatedMessage: ChatMessage = {
      ...state.currentChat.messages.find(m => m.id === messageId)!,
      content,
      timestamp: new Date().toISOString(),
    };

    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        chatId: state.currentChat.id,
        messageId,
        message: updatedMessage
      }
    });
  };

  const deleteChat = (chatId: string) => {
    dispatch({ type: 'DELETE_CHAT', payload: chatId });
  };

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (chat) {
      const updatedChat = { ...chat, ...updates, updatedAt: new Date().toISOString() };
      dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });
    }
  };

  const setSearchMode = (mode: SearchMode) => {
    dispatch({ type: 'SET_SEARCH_MODE', payload: mode });
  };

  const addSelectedFile = (fileId: string) => {
    dispatch({ type: 'ADD_SELECTED_FILE', payload: fileId });
  };

  const removeSelectedFile = (fileId: string) => {
    dispatch({ type: 'REMOVE_SELECTED_FILE', payload: fileId });
  };

  const clearSelectedFiles = () => {
    dispatch({ type: 'SET_SELECTED_FILES', payload: [] });
  };

  const value: ChatContextType = {
    state,
    dispatch,
    createChat,
    selectChat,
    sendMessage,
    updateMessage,
    deleteChat,
    updateChat,
    setSearchMode,
    addSelectedFile,
    removeSelectedFile,
    clearSelectedFiles,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 