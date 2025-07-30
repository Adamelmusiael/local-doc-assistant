import React, { ReactNode } from 'react';
import { ChatProvider } from './ChatContext';
import { FileProvider } from './FileContext';
import { UserProvider } from './UserContext';

// Main app provider that combines all contexts
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <UserProvider>
      <FileProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </FileProvider>
    </UserProvider>
  );
}; 