# Mock Data Directory

This directory contains all mock data, simulation functions, and test utilities used throughout the frontend application.

## Structure

```
mock/
├── index.ts              # Main exports and utilities
├── chatMocks.ts          # Chat-related mock data and functions
├── fileUploadMocks.ts    # File upload simulation logic
└── README.md            # This file
```

## Files

### `index.ts`
- Central export point for all mock data
- Contains utilities for enabling/disabling mocks
- Provides helper functions for conditional mock usage

### `chatMocks.ts`
- Mock chat messages for testing
- Mock model configurations
- Chat response simulation function
- Used by: ChatDialog, Chat page

### `fileUploadMocks.ts`
- File upload progress simulation
- Processing phase simulation
- File download/preview mock functions
- Used by: FileUpload, FileList components

## Usage

```typescript
// Import specific mocks
import { mockMessages, simulateChatResponse } from '../mock/chatMocks';
import { simulateFileProcessing } from '../mock/fileUploadMocks';

// Import all mocks
import * from '../mock';

// Conditional mock usage
import { withMocks } from '../mock';
const data = withMocks(mockData, realData);
```

## Environment

Mocks are enabled by default in development. To disable mocks, update `ENABLE_MOCKS` in `index.ts`.

## Adding New Mocks

1. Create a new file (e.g., `userMocks.ts`) 
2. Export mock data and functions
3. Add exports to `index.ts`
4. Update this README
