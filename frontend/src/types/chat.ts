import { Chat, ChatMessage, SearchMode } from './index';

export interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  searchMode: SearchMode;
  selectedFiles: string[];
}

export type ChatAction =
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

export interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  loadChats: () => Promise<void>;
  createChat: (title: string, model?: string) => Promise<void>;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, attachedFiles?: { id: string; name: string; type: string; size: number; fileId: string }[]) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  updateChat: (chatId: string, updates: Partial<Chat>) => Promise<void>;
  updateSessionModel: (chatId: string, model: string) => Promise<void>;
  setSearchMode: (mode: SearchMode) => void;
  addSelectedFile: (fileId: string) => void;
  removeSelectedFile: (fileId: string) => void;
  clearSelectedFiles: () => void;
}
