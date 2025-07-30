// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  sources?: string[];
  attachments?: FileAttachment[];
  isEditing?: boolean;
  isGenerating?: boolean;
}

// Chat session interface
export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

// File interface for documents
export interface File {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  uploadDate: string;
  isPublic: boolean;
  isConfidential: boolean;
  processingStatus: ProcessingStatus;
  chunks?: FileChunk[];
  metadata?: FileMetadata;
}

// File processing status
export enum ProcessingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed"
}

// File chunk interface
export interface FileChunk {
  id: string;
  content: string;
  fileId: string;
  chunkIndex: number;
  embedding?: number[];
}

// File metadata interface
export interface FileMetadata {
  pageCount?: number;
  wordCount?: number;
  language?: string;
  extractedText?: string;
  processingTime?: number;
}

// File attachment interface
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  fileId: string;
}

// Model interface for AI models
export interface Model {
  id: string;
  name: string;
  description: string;
  provider: string;
  maxTokens: number;
  isAvailable: boolean;
  default?: boolean;
}

// Search mode enum
export enum SearchMode {
  SELECTED = "selected",
  HYBRID = "hybrid",
  ALL = "all"
}

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences?: UserPreferences;
}

// User preferences interface
export interface UserPreferences {
  defaultModel: string;
  theme: "light" | "dark";
  language: string;
  autoSave: boolean;
  notifications: boolean;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Chat API interfaces
export interface SendMessageRequest {
  message: string;
  chatId?: string;
  model: string;
  attachments?: string[];
  searchMode: SearchMode;
}

export interface SendMessageResponse {
  message: ChatMessage;
  response: ChatMessage;
  sources?: string[];
}

// File API interfaces
export interface UploadFileRequest {
  file: File;
  isPublic: boolean;
  isConfidential: boolean;
}

export interface UploadFileResponse {
  file: File;
  processingStatus: ProcessingStatus;
}

// Settings interface
export interface Settings {
  models: Model[];
  user: User;
  systemSettings: SystemSettings;
}

export interface SystemSettings {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxFilesPerUpload: number;
  processingTimeout: number;
}
