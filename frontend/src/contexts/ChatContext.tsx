import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Chat, ChatMessage, SearchMode } from '../types';
import { chatService } from '../services/chatService';

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
  | { type: 'REMOVE_SELECTED_FILE'; payload: string }
  | { type: 'LOAD_CHATS_START' }
  | { type: 'LOAD_CHATS_SUCCESS'; payload: Chat[] }
  | { type: 'LOAD_CHATS_ERROR'; payload: string };

// Initial state (empty, will be loaded from backend)
const initialState: ChatState = {
  chats: [],
  currentChat: null,
  isLoading: false,
  error: null,
  searchMode: SearchMode.ALL,
  selectedFiles: [],
};

// Reducer function
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'LOAD_CHATS_START':
      return { ...state, isLoading: true, error: null };
    
    case 'LOAD_CHATS_SUCCESS':
      return { 
        ...state, 
        isLoading: false, 
        error: null,
        chats: action.payload,
        currentChat: action.payload.length > 0 ? action.payload[0] : null
      };
    
    case 'LOAD_CHATS_ERROR':
      return { ...state, isLoading: false, error: action.payload };

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
  loadChats: () => Promise<void>;
  createChat: (title: string, model?: string) => Promise<void>;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  updateChat: (chatId: string, updates: Partial<Chat>) => Promise<void>;
  updateSessionModel: (chatId: string, model: string) => Promise<void>;
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

  // Load chats from backend on mount
  React.useEffect(() => {
    loadChats();
  }, []);

  // Load all chats from backend
  const loadChats = async () => {
    dispatch({ type: 'LOAD_CHATS_START' });
    try {
      const chats = await chatService.loadAllSessions();
      dispatch({ type: 'LOAD_CHATS_SUCCESS', payload: chats });
    } catch (error) {
      dispatch({ type: 'LOAD_CHATS_ERROR', payload: 'Failed to load chat sessions' });
      console.error('Error loading chats:', error);
    }
  };

  // Create new chat
  const createChat = async (title: string, model?: string) => {
    try {
      const newChat = await chatService.createNewSession(title, model);
      dispatch({ type: 'ADD_CHAT', payload: newChat });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat session' });
      console.error('Error creating chat:', error);
    }
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

  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteSession(chatId);
      dispatch({ type: 'DELETE_CHAT', payload: chatId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete chat session' });
      console.error('Error deleting chat:', error);
    }
  };

  const updateChat = async (chatId: string, updates: Partial<Chat>) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;

    try {
      // If title is being updated, call backend to persist the change
      if (updates.title && updates.title !== chat.title) {
        await chatService.updateSessionTitle(chatId, updates.title);
      }
      
      // Update local state
      const updatedChat = { ...chat, ...updates, updatedAt: new Date().toISOString() };
      dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });
    } catch (error) {
      console.error('Error updating chat:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update chat' });
      
      // Revert the title change in case of backend error
      if (updates.title) {
        const revertedChat = { ...chat, updatedAt: new Date().toISOString() };
        dispatch({ type: 'UPDATE_CHAT', payload: revertedChat });
      }
    }
  };

  const updateSessionModel = async (chatId: string, model: string) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;

    const previousModel = chat.model;

    try {
      // Update local state immediately for responsive UI
      const updatedChat = { ...chat, model, updatedAt: new Date().toISOString() };
      dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });

      // Update backend
      await chatService.updateSessionModel(chatId, model);
    } catch (error) {
      console.error('Error updating session model:', error);
      
      // Revert to previous model on error
      const revertedChat = { ...chat, model: previousModel, updatedAt: new Date().toISOString() };
      dispatch({ type: 'UPDATE_CHAT', payload: revertedChat });
      
      // Set error for UI to display
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update model. Please choose a different model.' });
      
      // Clear error after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 5000);
      
      throw error;
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
    loadChats,
    createChat,
    selectChat,
    sendMessage,
    updateMessage,
    deleteChat,
    updateChat,
    updateSessionModel,
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