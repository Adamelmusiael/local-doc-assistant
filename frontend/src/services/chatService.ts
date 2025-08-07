import { chatAPI } from './api';
import { Chat, ChatMessage } from '../types';

// Transform backend session response to frontend Chat interface
export const transformBackendSessionToChat = (backendSession: any, messages: any[] = []): Chat => {
  return {
    id: backendSession.id.toString(),
    title: backendSession.title,
    messages: messages.map(transformBackendMessageToChatMessage),
    model: backendSession.llm_model || 'mistral',
    createdAt: backendSession.created_at || new Date().toISOString(),
    updatedAt: backendSession.created_at || new Date().toISOString(),
    isActive: backendSession.status === 'active'
  };
};

// Transform backend message response to frontend ChatMessage interface
export const transformBackendMessageToChatMessage = (backendMessage: any): ChatMessage => {
  let sources: string[] | undefined;
  if (backendMessage.sources) {
    try {
      // Backend stores sources as JSON string
      const parsedSources = typeof backendMessage.sources === 'string' 
        ? JSON.parse(backendMessage.sources)
        : backendMessage.sources;
      
      // Handle different source formats and extract unique filenames
      if (Array.isArray(parsedSources)) {
        const fileNames = new Set<string>(); // Use Set to avoid duplicates
        
        parsedSources.forEach((source: any) => {
          if (typeof source === 'string') {
            // If source is just a string, use it as is
            fileNames.add(source);
          } else if (source && typeof source === 'object') {
            // If source is an object with metadata, extract the document filename
            const metadata = source.metadata || {};
            
            // Try different possible fields for filename
            // Based on backend: filename (preferred), file_path, document_id are the main fields
            let fileName = metadata.filename;
            
            if (!fileName && metadata.file_path) {
              // Extract filename from file path if filename field is not available
              fileName = metadata.file_path.split('/').pop()?.split('\\').pop();
            }
            
            if (fileName) {
              fileNames.add(fileName);
            } else if (metadata.document_id) {
              // If no filename found, use document ID to create a meaningful name
              fileNames.add(`Document ${metadata.document_id}`);
            } else {
              // Last fallback - use a generic name but try to make it unique
              fileNames.add('Unknown document');
            }
          }
        });
        
        // Convert Set back to array and filter out empty/invalid entries
        sources = Array.from(fileNames).filter(name => name && name.trim() !== '');
      }
    } catch (error) {
      console.warn('Failed to parse sources:', error);
      sources = undefined;
    }
  }

  return {
    id: backendMessage.id.toString(),
    content: backendMessage.content,
    role: backendMessage.role as 'user' | 'assistant',
    timestamp: backendMessage.timestamp || new Date().toISOString(),
    sources,
    // Backend doesn't provide these yet, but we can add them later
    attachments: undefined,
    isEditing: false,
    isGenerating: false
  };
};

// Chat service functions
export const chatService = {
  // Load all chat sessions from backend
  loadAllSessions: async (): Promise<Chat[]> => {
    try {
      const response = await chatAPI.listSessions();
      const sessions = response.sessions || [];
      
      // Transform each session and get its messages
      const chats = await Promise.all(
        sessions.map(async (session: any) => {
          try {
            const messagesResponse = await chatAPI.getMessages(session.id.toString());
            const messages = messagesResponse.messages || [];
            return transformBackendSessionToChat(session, messages);
          } catch (error) {
            console.warn(`Failed to load messages for session ${session.id}:`, error);
            return transformBackendSessionToChat(session, []);
          }
        })
      );
      
      return chats;
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  },

  // Load messages for a specific session
  loadSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const response = await chatAPI.getMessages(sessionId);
      const messages = response.messages || [];
      return messages.map(transformBackendMessageToChatMessage);
    } catch (error) {
      console.error(`Failed to load messages for session ${sessionId}:`, error);
      return [];
    }
  },

  // Create a new chat session
  createNewSession: async (title: string = 'New Chat', model: string = 'mistral'): Promise<Chat> => {
    try {
      const response = await chatAPI.createSession(title, model);
      return transformBackendSessionToChat(response, []);
    } catch (error) {
      console.error('Failed to create new chat session:', error);
      throw error;
    }
  },

  // Delete a chat session
  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      await chatAPI.deleteSession(sessionId);
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      throw error;
    }
  },

  // Update session title (backend doesn't have this endpoint yet, so we'll skip for now)
  updateSessionTitle: async (sessionId: string, newTitle: string): Promise<void> => {
    try {
      await chatAPI.updateSession(sessionId, { title: newTitle });
    } catch (error) {
      console.error('Failed to update session title:', error);
      throw error;
    }
  }
};
