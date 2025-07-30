import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { File, ProcessingStatus } from '../types';

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

// Initial state
const initialState: FileState = {
  files: [],
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
  uploadFile: (file: File, isPublic: boolean, isConfidential: boolean) => Promise<void>;
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

// Provider component
interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(fileReducer, initialState);

  // Convenience methods
  const uploadFile = async (file: File, isPublic: boolean, isConfidential: boolean) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Simulate upload progress
      dispatch({ 
        type: 'SET_UPLOAD_PROGRESS', 
        payload: { fileId: file.id, progress: 0 } 
      });
      
      // TODO: Replace with actual API call
      // const response = await fileAPI.uploadFile(file, isPublic, isConfidential);
      
      // Simulate processing
      const processingFile: File = {
        ...file,
        isPublic,
        isConfidential,
        processingStatus: ProcessingStatus.PROCESSING,
      };
      
      dispatch({ type: 'ADD_FILE', payload: processingFile });
      
      // Simulate progress updates
      for (let i = 10; i <= 100; i += 10) {
        setTimeout(() => {
          dispatch({ 
            type: 'SET_UPLOAD_PROGRESS', 
            payload: { fileId: file.id, progress: i } 
          });
        }, i * 100);
      }
      
      // Simulate completion
      setTimeout(() => {
        const completedFile: File = {
          ...processingFile,
          processingStatus: ProcessingStatus.COMPLETED,
        };
        dispatch({ type: 'UPDATE_FILE', payload: completedFile });
        dispatch({ type: 'CLEAR_UPLOAD_PROGRESS', payload: file.id });
      }, 3000);
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Replace with actual API call
      // await fileAPI.deleteFile(fileId);
      
      dispatch({ type: 'DELETE_FILE', payload: fileId });
    } catch (error) {
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

  const value: FileContextType = {
    state,
    dispatch,
    uploadFile,
    deleteFile,
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