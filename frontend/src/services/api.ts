import axios from 'axios';
import {
  ChatMessage,
  Model,
  SearchMode,
  ApiResponse,
  SendMessageRequest,
  SendMessageResponse,
  AsyncUploadResponse,
  ProcessingStatusResponse,
} from '../types';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
});

// --- Chat Operations ---
export const chatAPI = {
  // Send a message to the chat endpoint
  sendMessage: async (data: SendMessageRequest): Promise<ApiResponse<SendMessageResponse>> => {
    const response = await apiClient.post(`/chat/${data.chatId}/message`, data);
    return response.data;
  },

  // Get chat session details
  getSession: async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/chat/chat_sessions/${sessionId}`);
    return response.data;
  },

  // Get chat messages for a specific session
  getMessages: async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/chat/${sessionId}/messages`);
    return response.data;
  },

  // List all chat sessions
  listSessions: async (): Promise<any> => {
    const response = await apiClient.get(`/chat/chat_sessions`);
    return response.data;
  },

  // Create new chat session
  createSession: async (title: string, model: string = 'mistral'): Promise<any> => {
    const response = await apiClient.post(`/chat/chat_sessions`, {
      title,
      llm_model: model,
      user_id: 'user', // Default user ID for now
      status: 'active',
      session_metadata: null
    });
    return response.data;
  },

  // Delete chat session
  deleteSession: async (sessionId: string): Promise<any> => {
    const response = await apiClient.delete(`/chat/chat_sessions/${sessionId}`);
    return response.data;
  },
};

// --- File Operations ---
export const fileAPI = {
  // Upload a file with async processing and progress tracking
  uploadFile: async (file: File, isConfidential: boolean): Promise<AsyncUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('confidentiality', isConfidential ? 'confidential' : 'public');
    const response = await apiClient.post(`/docs/upload_file_async`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get processing status for a task
  getProcessingStatus: async (taskId: number): Promise<ProcessingStatusResponse> => {
    const response = await apiClient.get(`/docs/processing/${taskId}/status`);
    return response.data;
  },

  // Delete a file (and its chunks/metadata)
  deleteFile: async (fileId: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await apiClient.delete(`/docs/${fileId}`);
    return response.data;
  },

  // List all files
  listFiles: async (): Promise<any> => {
    const response = await apiClient.get(`/docs/list_documents`);
    return response.data;
  },
};

// --- Model Operations ---
export const modelAPI = {
  // Get available models
  getModels: async (): Promise<ApiResponse<Model[]>> => {
    const response = await apiClient.get(`/chat/models`);
    return response.data;
  },
};

// --- Search Operations ---
export const searchAPI = {
  // Search with different modes (selected, hybrid, all)
  search: async (query: string, mode: SearchMode, fileIds?: string[]): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await apiClient.post(`/search`, {
      query,
      mode,
      fileIds,
    });
    return response.data;
  },
};
