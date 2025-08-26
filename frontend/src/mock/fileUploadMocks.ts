import { ProcessingStatus, ProcessingPhase } from '../types';

export interface FileWithProgress {
  file: File;
  progress: number;
  status: ProcessingStatus;
  error?: string;
  processingPhase?: ProcessingPhase;
}

export type FileUpdateCallback = (
  updateFn: (prev: FileWithProgress[]) => FileWithProgress[]
) => void;

export const simulatePhaseProgress = async (
  index: number,
  phase: ProcessingPhase,
  updateFiles: FileUpdateCallback,
  stepSize: number = 10,
  delay: number = 100
) => {
  updateFiles(prev => prev.map((f, i) => 
    i === index ? { ...f, processingPhase: phase, progress: 0 } : f
  ));

  for (let progress = 0; progress <= 100; progress += stepSize) {
    await new Promise(resolve => setTimeout(resolve, delay));
    updateFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, progress } : f
    ));
  }
};

export const simulateFileProcessing = async (
  currentIndex: number,
  updateFiles: FileUpdateCallback
) => {
  // Upload phase
  await simulatePhaseProgress(currentIndex, 'upload', updateFiles, 10, 100);

  // Text extraction phase
  await simulatePhaseProgress(currentIndex, 'text_extraction', updateFiles, 20, 150);

  // Chunking phase
  await simulatePhaseProgress(currentIndex, 'chunking', updateFiles, 25, 100);

  // Vectorization phase
  await simulatePhaseProgress(currentIndex, 'vectorization', updateFiles, 15, 120);
};

export const getProcessingPhaseLabel = (phase?: ProcessingPhase): string => {
  switch (phase) {
    case 'upload': return 'Uploading';
    case 'text_extraction': return 'Extracting Text';
    case 'chunking': return 'Chunking Content';
    case 'vectorization': return 'Vectorizing';
    default: return 'Processing';
  }
};

// Mock functions for file operations
export const simulateFileDownload = (fileName: string, content: string = 'Simulated file content') => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content]));
  link.download = fileName;
  link.click();
};

export const simulateFilePreview = (fileId: string) => {
  // In real app this would open a modal or new tab with file content
  window.open(`/api/files/${fileId}/preview`, '_blank');
};
