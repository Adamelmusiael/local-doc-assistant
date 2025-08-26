import { chatAPI } from './api';
import { SendMessageRequest } from '../types';

export interface StreamChunk {
  type: 'start' | 'chunk' | 'sources' | 'status' | 'metadata' | 'done' | 'error';
  content?: string;
  session_id?: number;
  model?: string;
  sources?: any[];
  chunks_used?: number;
  error?: string;
}

export class StreamingChatService {
  private controller: AbortController | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  async streamMessage(
    data: SendMessageRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    this.controller = new AbortController();

    try {
      const response = await chatAPI.sendMessageStream(data);
      
      if (!response.body) {
        throw new Error('No response body available for streaming');
      }

      this.reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await this.reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last line in buffer in case it's incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6).trim();
              if (data) {
                const chunk: StreamChunk = JSON.parse(data);
                onChunk(chunk);
                
                if (chunk.type === 'done') {
                  return;
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError(error);
      }
    } finally {
      this.cleanup();
    }
  }

  abort(): void {
    if (this.controller) {
      this.controller.abort();
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.reader) {
      this.reader.releaseLock();
      this.reader = null;
    }
    this.controller = null;
  }
}
