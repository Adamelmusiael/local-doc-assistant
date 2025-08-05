import { ChatMessage, Model, SearchMode } from '../types';

// Mock chat messages
export const mockMessages: ChatMessage[] = [
  {
    id: "1",
    content: "Hello, how are you?",
    role: "user",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    content: "I am fine, thank you! I can help you with various tasks including answering questions, analyzing documents, and providing insights based on your uploaded files.",
    role: "assistant",
    timestamp: new Date().toISOString(),
    sources: ["document1.pdf", "document2.pdf"],
  },
  {
    id: "3",
    content: "Can you analyze the attached files?",
    role: "user",
    timestamp: new Date().toISOString(),
    attachments: [
      {
        id: "file1",
        name: "analysis.pdf",
        type: "application/pdf",
        size: 1024 * 1000,
        fileId: "file1",
      },
    ],
  },
];

// Mock models
export const mockModels: Model[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Most capable model for complex tasks",
    provider: "OpenAI",
    maxTokens: 8192,
    isAvailable: true,
    default: true,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and efficient for most tasks",
    provider: "OpenAI",
    maxTokens: 4096,
    isAvailable: true,
  },
  {
    id: "claude-3",
    name: "Claude 3",
    description: "Anthropic's latest model",
    provider: "Anthropic",
    maxTokens: 100000,
    isAvailable: true,
  },
];

// Mock API call simulation
export const simulateChatResponse = async (
  message: string,
  model: string,
  searchMode: SearchMode,
  attachments?: File[]
): Promise<ChatMessage> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    id: (Date.now() + 1).toString(),
    content: `I've received your message: "${message}" and I'm processing it with model ${model} in ${searchMode} mode.${
      attachments && attachments.length > 0 
        ? ` I can see you've attached ${attachments.length} file(s).` 
        : ""
    }`,
    role: "assistant",
    timestamp: new Date().toISOString(),
    sources: attachments && attachments.length > 0 ? attachments.map(file => file.name) : undefined,
  };
};
