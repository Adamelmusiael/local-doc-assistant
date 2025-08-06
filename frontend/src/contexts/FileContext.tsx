import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { File, ProcessingStatus, ProcessingStatusResponse } from '../types';
import { fileAPI } from '../services/api';

// State interface for file context
interface FileState {
  files: File[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: { [key: string]: number };
  selectedFiles: string[];
}

// Action types for file context
type FileAction =
  | { type: 'SET_FILES'; payload: File[] }
  | { type: 'ADD_FILE'; payload: File }
  | { type: 'UPDATE_FILE'; payload: File }
  | { type: 'DELETE_FILE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: { fileId: string; progress: number } }
  | { type: 'CLEAR_UPLOAD_PROGRESS'; payload: string }
  | { type: 'SET_SELECTED_FILES'; payload: string[] }
  | { type: 'ADD_SELECTED_FILE'; payload: string }
  | { type: 'REMOVE_SELECTED_FILE'; payload: string }
  | { type: 'CLEAR_SELECTED_FILES' };

// Initial state - Start with empty files, will load from API
const initialState: FileState = {
  files: [], // Start empty - will be populated from backend
  isLoading: false,
  error: null,
  uploadProgress: {},
  selectedFiles: [],
};

// Reducer function
const fileReducer = (state: FileState, action: FileAction): FileState => {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload };
    
    case 'ADD_FILE':
      return { 
        ...state, 
        files: [action.payload, ...state.files] 
      };
    
    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map(file => 
          file.id === action.payload.id ? action.payload : file
        )
      };
    
    case 'DELETE_FILE':
      return {
        ...state,
        files: state.files.filter(file => file.id !== action.payload),
        selectedFiles: state.selectedFiles.filter(id => id !== action.payload)
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: {
          ...state.uploadProgress,
          [action.payload.fileId]: action.payload.progress
        }
      };
    
    case 'CLEAR_UPLOAD_PROGRESS':
      const newProgress = { ...state.uploadProgress };
      delete newProgress[action.payload];
      return { ...state, uploadProgress: newProgress };
    
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
    
    case 'CLEAR_SELECTED_FILES':
      return { ...state, selectedFiles: [] };
    
    default:
      return state;
  }
};

// Context interface
interface FileContextType {
  state: FileState;
  dispatch: React.Dispatch<FileAction>;
  // Convenience methods
  loadFiles: () => Promise<void>; // New method to load files from API
  uploadFile: (file: globalThis.File, isConfidential: boolean) => Promise<number>; // Returns task_id for tracking
  getProcessingStatus: (taskId: number) => Promise<ProcessingStatusResponse>; // Get processing progress
  deleteFile: (fileId: string) => Promise<void>;
  getFile: (fileId: string) => File | undefined;
  getFilesByStatus: (status: ProcessingStatus) => File[];
  selectFile: (fileId: string) => void;
  deselectFile: (fileId: string) => void;
  clearSelectedFiles: () => void;
  updateFilePrivacy: (fileId: string, isPublic: boolean, isConfidential: boolean) => Promise<void>;
}

// Create context
const FileContext = createContext<FileContextType | undefined>(undefined);

// Helper function to transform backend data to frontend format
const transformBackendFile = (backendFile: any): File => {
  return {
    id: String(backendFile.id), // Convert number to string
    name: backendFile.filename || 'Unknown',
    originalName: backendFile.filename || 'Unknown',
    size: backendFile.file_size || 0, // Use real file size from backend
    type: 'application/pdf', // Default type, backend doesn't provide this
    uploadDate: backendFile.created_at || new Date().toISOString(),
    isPublic: backendFile.confidentiality === 'public',
    isConfidential: backendFile.confidentiality === 'confidential',
    processingStatus: backendFile.processed ? ProcessingStatus.COMPLETED : ProcessingStatus.PENDING,
    chunks: [],
    metadata: {
      // Limited metadata from this endpoint
      extractedText: undefined,
      pageCount: undefined,
      wordCount: undefined,
      language: undefined,
      processingTime: undefined
    }
  };
};

// Provider component
interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(fileReducer, initialState);

  // Load files from backend API
  const loadFiles = async () => {
    try {
      console.log('Loading files from backend...');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await fileAPI.listFiles();
      console.log('RAW API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response.documents exists:', !!response.documents);
      console.log('Response.documents length:', response.documents ? response.documents.length : 'N/A');
      
      // Handle the actual backend response structure: {message, total_documents, documents}
      if (response.documents && response.documents.length > 0) {
        console.log('Starting file transformation...');
        // Transform backend data to frontend format
        const transformedFiles = response.documents.map(transformBackendFile);
        console.log('Transformed files:', transformedFiles);
        dispatch({ type: 'SET_FILES', payload: transformedFiles });
        console.log(`Loaded ${transformedFiles.length} files successfully`);
      } else {
        console.log('No files found in backend - setting empty array');
        dispatch({ type: 'SET_FILES', payload: [] });
      }
      
    } catch (error) {
      console.error('Failed to load files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load files';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      // Don't clear existing files on error, user can retry
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load files when component mounts
  useEffect(() => {
    loadFiles();
  }, []);

  // Convenience methods
  const uploadFile = async (fileToUpload: globalThis.File, isConfidential: boolean): Promise<number> => {
    try {
      console.log('Uploading file:', fileToUpload.name);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Call async upload API
      const response = await fileAPI.uploadFile(fileToUpload, isConfidential);
      console.log('File uploaded successfully, task_id:', response.task_id);
      
      // Return task_id for progress tracking
      return response.task_id;
      
    } catch (error) {
      console.error('File upload failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Upload failed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      console.log('Deleting file:', fileId);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call real API instead of mock
      await fileAPI.deleteFile(fileId);
      console.log('File deleted successfully');
      
      // Remove from local state
      dispatch({ type: 'DELETE_FILE', payload: fileId });
      
    } catch (error) {
      console.error('File deletion failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Delete failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getFile = (fileId: string): File | undefined => {
    return state.files.find(file => file.id === fileId);
  };

  const getFilesByStatus = (status: ProcessingStatus): File[] => {
    return state.files.filter(file => file.processingStatus === status);
  };

  const selectFile = (fileId: string) => {
    dispatch({ type: 'ADD_SELECTED_FILE', payload: fileId });
  };

  const deselectFile = (fileId: string) => {
    dispatch({ type: 'REMOVE_SELECTED_FILE', payload: fileId });
  };

  const clearSelectedFiles = () => {
    dispatch({ type: 'CLEAR_SELECTED_FILES' });
  };

  const updateFilePrivacy = async (fileId: string, isPublic: boolean, isConfidential: boolean) => {
    try {
      const file = getFile(fileId);
      if (!file) return;

      const updatedFile: File = {
        ...file,
        isPublic,
        isConfidential,
      };

      // TODO: Replace with actual API call
      // await fileAPI.updateFilePrivacy(fileId, isPublic, isConfidential);
      
      dispatch({ type: 'UPDATE_FILE', payload: updatedFile });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Update failed' });
    }
  };

  const getProcessingStatus = async (taskId: number): Promise<ProcessingStatusResponse> => {
    try {
      return await fileAPI.getProcessingStatus(taskId);
    } catch (error) {
      console.error('Failed to get processing status:', error);
      throw error;
    }
  };

  const value: FileContextType = {
    state,
    dispatch,
    uploadFile,
    getProcessingStatus,
    deleteFile,
    loadFiles,
    getFile,
    getFilesByStatus,
    selectFile,
    deselectFile,
    clearSelectedFiles,
    updateFilePrivacy,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};

// Hook to use file context
export const useFile = (): FileContextType => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFile must be used within a FileProvider');
  }
  return context;
}; 