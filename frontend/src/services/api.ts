import axios from 'axios';
import {
  ChatMessage,
  Chat,
  File as FileType,
  Model,
  SearchMode,
  ApiResponse,
  SendMessageRequest,
  SendMessageResponse,
  UploadFileResponse,
} from '../types';

// Note: Removed API_BASE - using direct paths to match backend endpoints

// --- Chat Operations ---
export const chatAPI = {
  // Send a message to the chat endpoint
  sendMessage: async (data: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> => {
    const response = await axios.post(`/chat/${data.chatId}/message`, data);
    return response.data;
  },

  // Get chat history for a specific chat session
  getHistory: async (chatId: string): Promise<ApiResponse<Chat>> => {
    const response = await axios.get(`/chat/chat_sessions/${chatId}`);
    return response.data;
  },

  // List all chat sessions
  listChats: async (): Promise<ApiResponse<Chat[]>> => {
    const response = await axios.get(`/chat/chat_sessions`);
    return response.data;
  },
};

// --- File Operations ---
export const fileAPI = {
  // Upload a file (with privacy settings)
  uploadFile: async (file: File, isPublic: boolean, isConfidential: boolean): Promise<ApiResponse<UploadFileResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPublic', String(isPublic));
    formData.append('isConfidential', String(isConfidential));
    const response = await axios.post(`/docs/upload_file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete a file (and its chunks/metadata)
  deleteFile: async (fileId: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await axios.delete(`/docs/${fileId}`);
    return response.data;
  },

  // List all files
  listFiles: async (): Promise<any> => {
    const response = await axios.get(`/docs/list_documents`);
    return response.data;
  },
};

// --- Model Operations ---
export const modelAPI = {
  // Get available models
  getModels: async (): Promise<ApiResponse<Model[]>> => {
    const response = await axios.get(`/models`);
    return response.data;
  },
};

// --- Search Operations ---
export const searchAPI = {
  // Search with different modes (selected, hybrid, all)
  search: async (query: string, mode: SearchMode, fileIds?: string[]): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await axios.post(`/search`, {
      query,
      mode,
      fileIds,
    });
    return response.data;
  },
};
