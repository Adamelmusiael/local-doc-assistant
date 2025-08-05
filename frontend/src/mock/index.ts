// Re-export all mock data and functions for easy importing
export * from './fileUploadMocks';
export * from './chatMocks';

// Mock data organization
export const MOCK_DATA = {
  files: 'fileUploadMocks',
  chat: 'chatMocks',
} as const;

// Environment flag for enabling/disabling mocks
export const ENABLE_MOCKS = true; // Set to false in production

// Helper function to conditionally use mocks
export const withMocks = <T>(mockValue: T, realValue: T): T => {
  return ENABLE_MOCKS ? mockValue : realValue;
};
