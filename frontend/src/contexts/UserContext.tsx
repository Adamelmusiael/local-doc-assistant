import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User, UserPreferences, Model } from '../types';

// State interface for user context
interface UserState {
  user: User | null;
  preferences: UserPreferences | null;
  availableModels: Model[];
  selectedModel: string | null;
  isLoading: boolean;
  error: string | null;
}

// Action types for user context
type UserAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_AVAILABLE_MODELS'; payload: Model[] }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

// Initial state
const initialState: UserState = {
  user: null,
  preferences: null,
  availableModels: [],
  selectedModel: null,
  isLoading: false,
  error: null,
};

// Default user preferences
const defaultPreferences: UserPreferences = {
  defaultModel: 'mistral',
  theme: 'dark',
  language: 'en',
  autoSave: true,
  notifications: true,
};

// Reducer function
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: state.preferences 
          ? { ...state.preferences, ...action.payload }
          : { ...defaultPreferences, ...action.payload }
      };
    
    case 'SET_AVAILABLE_MODELS':
      return { ...state, availableModels: action.payload };
    
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        preferences: null,
        selectedModel: null,
      };
    
    default:
      return state;
  }
};

// Context interface
interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
  // Convenience methods
  login: (user: User) => void;
  logout: () => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setDefaultModel: (modelId: string) => Promise<void>;
  getCurrentModel: () => Model | undefined;
  isAuthenticated: () => boolean;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Convenience methods
  const login = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
    
    // Set default preferences if none exist
    if (!state.preferences) {
      dispatch({ type: 'SET_PREFERENCES', payload: defaultPreferences });
    }
    
    // Set default model if none selected
    if (!state.selectedModel && state.preferences) {
      dispatch({ type: 'SET_SELECTED_MODEL', payload: state.preferences.defaultModel });
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // TODO: Replace with actual API call
      // await userAPI.updatePreferences(preferences);
      
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Update failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setTheme = (theme: 'light' | 'dark') => {
    updateUserPreferences({ theme });
  };

  const setDefaultModel = async (modelId: string) => {
    try {
      await updateUserPreferences({ defaultModel: modelId });
      dispatch({ type: 'SET_SELECTED_MODEL', payload: modelId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Model update failed' });
    }
  };

  const getCurrentModel = (): Model | undefined => {
    const modelId = state.selectedModel || state.preferences?.defaultModel;
    return state.availableModels.find(model => model.id === modelId);
  };

  const isAuthenticated = (): boolean => {
    return state.user !== null;
  };

  const value: UserContextType = {
    state,
    dispatch,
    login,
    logout,
    updateUserPreferences,
    setTheme,
    setDefaultModel,
    getCurrentModel,
    isAuthenticated,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 