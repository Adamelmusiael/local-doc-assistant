import { useMemo } from 'react';
import { useFile } from '../contexts/FileContext';
import { useChat } from '../contexts/ChatContext';
import { useModels } from './useModels';

export interface ConfidentialityValidation {
  hasConfidentialFiles: boolean;
  isModelCompatible: boolean;
  warningMessage: string | null;
  blockedReason: string | null;
  needsConfirmation: boolean;
  confidentialFileNames: string[];
  shouldShowModal: boolean;
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

    let blockedReason: string | null = null;
    let needsConfirmation = false;
    let confidentialFileNames: string[] = [];

    if (hasConfidentialFiles && !isModelCompatible) {
      confidentialFileNames = selectedFiles
        .filter(file => file.isConfidential)
        .map(file => file.originalName);
      
      // We need confirmation but no longer show inline warning
      needsConfirmation = true;
    }

    return {
      hasConfidentialFiles,
      isModelCompatible: hasConfidentialFiles ? isModelCompatible : true,
      warningMessage: null, // No more inline warnings
      blockedReason,
      needsConfirmation,
      confidentialFileNames,
      shouldShowModal: needsConfirmation, // Show modal immediately when confirmation needed
    };
  }, [selectedModelId, fileState.files, chatState.selectedFiles, canModelAccessConfidential, models]);
};

export default useConfidentialityValidation;
