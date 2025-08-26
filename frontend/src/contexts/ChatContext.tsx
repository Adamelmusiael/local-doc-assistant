import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Chat, ChatMessage, SearchMode } from '../types';
import { ChatState, ChatContextType } from '../types/chat';
import { chatReducer } from '../reducers/chatReducer';
import { chatService } from '../services/chatService';
import { StreamingChatService, StreamChunk } from '../services/streamingService';
import { createTimestamp } from '../utils/dateUtils';

// Initial state (empty, will be loaded from backend)
const initialState: ChatState = {
  chats: [],
  currentChat: null,
  isLoading: false,
  error: null,
  searchMode: SearchMode.ALL,
  selectedFiles: [],
};

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load chats from backend on mount
  React.useEffect(() => {
    loadChats();
  }, []);

  // Load all chats from backend
  const loadChats = async () => {
    dispatch({ type: 'LOAD_CHATS_START' });
    try {
      const chats = await chatService.loadAllSessions();
      dispatch({ type: 'LOAD_CHATS_SUCCESS', payload: chats });
    } catch (error) {
      dispatch({ type: 'LOAD_CHATS_ERROR', payload: 'Failed to load chat sessions' });
      console.error('Error loading chats:', error);
    }
  };

  // Create new chat
  const createChat = async (title: string, model?: string) => {
    try {
      const newChat = await chatService.createNewSession(title, model);
      dispatch({ type: 'ADD_CHAT', payload: newChat });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat session' });
      console.error('Error creating chat:', error);
    }
  };

  const selectChat = (chatId: string) => {
    const chat = state.chats.find(c => c.id === chatId);
    dispatch({ type: 'SET_CURRENT_CHAT', payload: chat || null });
  };

  const sendMessage = async (content: string, attachedFiles?: { id: string; name: string; type: string; size: number; fileId: string }[]) => {
    if (!state.currentChat) return;

    // Create user message with pending status
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: createTimestamp(),
      status: 'pending',
      attachments: attachedFiles || undefined,
    };

    // Add user message immediately to UI
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { chatId: state.currentChat.id, message: userMessage } 
    });

    // Clear selected files after sending
    dispatch({ type: 'SET_SELECTED_FILES', payload: [] });

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: createTimestamp(),
      status: 'streaming',
      isGenerating: true,
    };

    // Add assistant message placeholder
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { chatId: state.currentChat.id, message: assistantMessage }
    });

    // Start streaming
    const streamingService = new StreamingChatService();
    const currentChatId = state.currentChat.id;
    let accumulatedContent = ''; // Track accumulated content
    let accumulatedSources: string[] = [];

    try {
      // Extract document IDs from attached files (simple conversion since fileId is String(documentId))
      let documentIds: number[] = [];
      if (attachedFiles && attachedFiles.length > 0) {
        // Since frontend fileId is String(documentId), we can convert back to numbers
        documentIds = attachedFiles
          .map(file => parseInt(file.fileId, 10))
          .filter(id => !isNaN(id)); // Filter out invalid IDs
        
        console.log('Using document IDs from attached files:', {
          attachedFiles: attachedFiles.map(f => ({ fileId: f.fileId, name: f.name })),
          documentIds: documentIds
        });
      }

      // Update user message status to sending
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          chatId: currentChatId,
          messageId: userMessage.id,
          message: { ...userMessage, status: 'sending' }
        }
      });

      await streamingService.streamMessage(
        {
          message: content,
          chatId: currentChatId,
          model: state.currentChat.model || 'mistral',
          searchMode: state.searchMode,
          attachments: documentIds // Use converted document IDs
        },
        (chunk: StreamChunk) => {
          // Handle streaming chunks
          switch (chunk.type) {
            case 'start':
              // Mark user message as sent
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                  chatId: currentChatId,
                  messageId: userMessage.id,
                  message: { ...userMessage, status: 'sent' }
                }
              });
              break;

            case 'chunk':
              // Update assistant message with accumulated content
              if (chunk.content) {
                accumulatedContent += chunk.content;
                
                // Update immediately for better responsiveness (remove throttling for now)
                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: {
                    chatId: currentChatId,
                    messageId: assistantMessageId,
                    message: {
                      ...assistantMessage,
                      content: accumulatedContent,
                      status: 'streaming',
                      isGenerating: true
                    }
                  }
                });
              }
              break;

            case 'sources':
              // Update assistant message with sources
              if (chunk.sources) {
                accumulatedSources = chunk.sources.map(s => typeof s === 'string' ? s : s.text || '');
                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: {
                    chatId: currentChatId,
                    messageId: assistantMessageId,
                    message: {
                      ...assistantMessage,
                      content: accumulatedContent,
                      sources: accumulatedSources,
                      status: 'streaming',
                      isGenerating: true
                    }
                  }
                });
              }
              break;

            case 'done':
              // Mark as completed with final content
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                  chatId: currentChatId,
                  messageId: assistantMessageId,
                  message: {
                    ...assistantMessage,
                    content: accumulatedContent,
                    sources: accumulatedSources,
                    status: 'completed',
                    isGenerating: false
                  }
                }
              });
              break;

            case 'error':
              // Handle streaming error
              dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                  chatId: currentChatId,
                  messageId: assistantMessageId,
                  message: {
                    ...assistantMessage,
                    content: accumulatedContent, // Keep whatever was streamed
                    status: 'error',
                    isGenerating: false,
                    error: {
                      message: chunk.error || 'Unknown streaming error',
                      retryable: true
                    }
                  }
                }
              });
              break;
          }
        },
        (error: Error) => {
          // Handle connection error
          console.error('Streaming error:', error);
          
          // Mark user message as error if it failed to send
          if (userMessage.status === 'sending') {
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: {
                chatId: currentChatId,
                messageId: userMessage.id,
                message: {
                  ...userMessage,
                  status: 'error',
                  error: {
                    message: 'Failed to send message',
                    retryable: true
                  }
                }
              }
            });
          }

          // Mark assistant message as error
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              chatId: currentChatId,
              messageId: assistantMessageId,
              message: {
                ...assistantMessage,
                content: accumulatedContent, // Keep whatever was streamed
                status: 'error',
                isGenerating: false,
                error: {
                  message: error.message || 'Connection failed',
                  retryable: true
                }
              }
            }
          });
        }
      );
    } catch (error) {
      console.error('Failed to start streaming:', error);
      
      // Handle initial request error
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          chatId: currentChatId,
          messageId: userMessage.id,
          message: {
            ...userMessage,
            status: 'error',
            error: {
              message: 'Failed to send message',
              retryable: true
            }
          }
        }
      });

      // Mark assistant message as error
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          chatId: currentChatId,
          messageId: assistantMessageId,
          message: {
            ...assistantMessage,
            status: 'error',
            isGenerating: false,
            error: {
              message: 'Failed to connect to server',
              retryable: true
            }
          }
        }
      });
    }
  };

  const updateMessage = (messageId: string, content: string) => {
    if (!state.currentChat) return;

    const updatedMessage: ChatMessage = {
      ...state.currentChat.messages.find(m => m.id === messageId)!,
      content,
      timestamp: createTimestamp(),
    };

    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        chatId: state.currentChat.id,
        messageId,
        message: updatedMessage
      }
    });
  };

  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteSession(chatId);
      dispatch({ type: 'DELETE_CHAT', payload: chatId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete chat session' });
      console.error('Error deleting chat:', error);
    }
  };

  const updateChat = async (chatId: string, updates: Partial<Chat>) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;

    try {
      // If title is being updated, call backend to persist the change
      if (updates.title && updates.title !== chat.title) {
        await chatService.updateSessionTitle(chatId, updates.title);
      }
      
      // Update local state
      const updatedChat = { ...chat, ...updates, updatedAt: createTimestamp() };
      dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });
    } catch (error) {
      console.error('Error updating chat:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update chat' });
      
      // Revert the title change in case of backend error
      if (updates.title) {
        const revertedChat = { ...chat, updatedAt: createTimestamp() };
        dispatch({ type: 'UPDATE_CHAT', payload: revertedChat });
      }
    }
  };

  const updateSessionModel = async (chatId: string, model: string) => {
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;

    const previousModel = chat.model;

    try {
      // Update local state immediately for responsive UI
      const updatedChat = { ...chat, model, updatedAt: createTimestamp() };
      dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });

      // Update backend
      await chatService.updateSessionModel(chatId, model);
    } catch (error) {
      console.error('Error updating session model:', error);
      
      // Revert to previous model on error
      const revertedChat = { ...chat, model: previousModel, updatedAt: createTimestamp() };
      dispatch({ type: 'UPDATE_CHAT', payload: revertedChat });
      
      // Set error for UI to display
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update model. Please choose a different model.' });
      
      // Clear error after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 5000);
      
      throw error;
    }
  };

  const setSearchMode = (mode: SearchMode) => {
    dispatch({ type: 'SET_SEARCH_MODE', payload: mode });
  };

  const addSelectedFile = (fileId: string) => {
    dispatch({ type: 'ADD_SELECTED_FILE', payload: fileId });
  };

  const removeSelectedFile = (fileId: string) => {
    dispatch({ type: 'REMOVE_SELECTED_FILE', payload: fileId });
  };

  const clearSelectedFiles = () => {
    dispatch({ type: 'SET_SELECTED_FILES', payload: [] });
  };

  const value: ChatContextType = {
    state,
    dispatch,
    loadChats,
    createChat,
    selectChat,
    sendMessage,
    updateMessage,
    deleteChat,
    updateChat,
    updateSessionModel,
    setSearchMode,
    addSelectedFile,
    removeSelectedFile,
    clearSelectedFiles,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 