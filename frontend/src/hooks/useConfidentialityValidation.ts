import { useMemo } from 'react';
import { useFile } from '../contexts/FileContext';
import { useChat } from '../contexts/ChatContext';
import { useModels } from './useModels';

export interface ConfidentialityValidation {
  hasConfidentialFiles: boolean;
  isModelCompatible: boolean;
  warningMessage: string | null;
  blockedReason: string | null;
}

export const useConfidentialityValidation = (selectedModelId: string): ConfidentialityValidation => {
  const { state: fileState } = useFile();
  const { state: chatState } = useChat();
  const { canModelAccessConfidential, models } = useModels();

  return useMemo(() => {
    // Get selected files
    const selectedFiles = fileState.files.filter(file => 
      chatState.selectedFiles.includes(file.id)
    );

    // Check if any selected files are confidential
    const hasConfidentialFiles = selectedFiles.some(file => file.isConfidential);

    // Check if current model can access confidential data
    const isModelCompatible = canModelAccessConfidential(selectedModelId);

    let warningMessage: string | null = null;
    let blockedReason: string | null = null;

    if (hasConfidentialFiles && !isModelCompatible) {
      const confidentialFileNames = selectedFiles
        .filter(file => file.isConfidential)
        .map(file => file.originalName);
      
      const fileCount = confidentialFileNames.length;
      const fileText = fileCount === 1 ? 'file' : 'files';
      const truncatedNames = confidentialFileNames.length > 2 
        ? `${confidentialFileNames.slice(0, 2).join(', ')} and ${confidentialFileNames.length - 2} more`
        : confidentialFileNames.join(', ');

      // Only show the blocking error message, not the warning
      warningMessage = null;
      blockedReason = `Cannot Send Message: You have ${fileCount} confidential ${fileText} attached (${truncatedNames}) but selected "${selectedModelId}" which is an external model. Confidential files can only be processed by local models for security reasons. Please either switch to a local model (like Mistral) or remove the confidential files to continue.`;
    }

    return {
      hasConfidentialFiles,
      isModelCompatible: hasConfidentialFiles ? isModelCompatible : true,
      warningMessage,
      blockedReason,
    };
  }, [selectedModelId, fileState.files, chatState.selectedFiles, canModelAccessConfidential, models]);
};

export default useConfidentialityValidation;
