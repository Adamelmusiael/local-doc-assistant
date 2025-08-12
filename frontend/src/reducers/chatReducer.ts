import { ChatState, ChatAction } from '../types/chat';
import { createTimestamp } from '../utils/dateUtils';

// Reducer function for chat context state management
export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
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
              updatedAt: createTimestamp()
            };
          }
          return chat;
        }),
        currentChat: state.currentChat?.id === action.payload.chatId
          ? {
              ...state.currentChat,
              messages: [...state.currentChat.messages, action.payload.message],
              updatedAt: createTimestamp()
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
