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
  UploadFileRequest,
  UploadFileResponse,
} from '../types';

const API_BASE = '/api';

// --- Chat Operations ---
export const chatAPI = {
  // Send a message to the chat endpoint
  sendMessage: async (data: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> => {
    const response = await axios.post(`${API_BASE}/chat`, data);
    return response.data;
  },

  // Get chat history for a specific chat session
  getHistory: async (chatId: string): Promise<ApiResponse<Chat>> => {
    const response = await axios.get(`${API_BASE}/chat/${chatId}`);
    return response.data;
  },

  // List all chat sessions
  listChats: async (): Promise<ApiResponse<Chat[]>> => {
    const response = await axios.get(`${API_BASE}/chat/sessions`);
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
    const response = await axios.post(`${API_BASE}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete a file (and its chunks/metadata)
  deleteFile: async (fileId: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await axios.delete(`${API_BASE}/documents/${fileId}`);
    return response.data;
  },

  // List all files
  listFiles: async (): Promise<ApiResponse<FileType[]>> => {
    const response = await axios.get(`${API_BASE}/documents`);
    return response.data;
  },
};

// --- Model Operations ---
export const modelAPI = {
  // Get available models
  getModels: async (): Promise<ApiResponse<Model[]>> => {
    const response = await axios.get(`${API_BASE}/models`);
    return response.data;
  },
};

// --- Search Operations ---
export const searchAPI = {
  // Search with different modes (selected, hybrid, all)
  search: async (query: string, mode: SearchMode, fileIds?: string[]): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await axios.post(`${API_BASE}/search`, {
      query,
      mode,
      fileIds,
    });
    return response.data;
  },
};
