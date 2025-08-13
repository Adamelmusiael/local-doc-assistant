import { useState, useEffect } from 'react';
import { Model } from '../types';
import { modelAPI } from '../services/api';

interface ModelsResponse {
  models: Model[];
  default_model: string;
}

export const useModels = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultModel, setDefaultModel] = useState<string>('mistral');

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await modelAPI.getModels() as unknown as ModelsResponse;
        
        if (response.models) {
          setModels(response.models);
          if (response.default_model) {
            setDefaultModel(response.default_model);
          }
          return;
        }
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
      }
      
      // Fallback to mock data if API fails
      const mockModels: Model[] = [
        {
          id: "mistral",
          name: "Mistral",
          description: "Local model - fast and efficient",
          provider: "Local",
          maxTokens: 4096,
          isAvailable: true,
          default: true,
          isLocal: true,
          canAccessConfidential: true,
        },
        {
          id: "llama3.1-8b-128k",
          name: "Llama 3.1 8B",
          description: "Advanced local model with 128K context window",
          provider: "Local",
          maxTokens: 128000,
          isAvailable: true,
          isLocal: true,
          canAccessConfidential: true,
        },
        {
          id: "qwen2.5-1m",
          name: "Qwen 2.5 1M",
          description: "Large context local model with 1M tokens - ideal for long documents",
          provider: "Local",
          maxTokens: 1000000,
          isAvailable: true,
          isLocal: true,
          canAccessConfidential: true,
        },
        {
          id: "gpt-4o",
          name: "GPT-4o",
          description: "Most capable OpenAI model",
          provider: "OpenAI",
          maxTokens: 8192,
          isAvailable: true,
          isLocal: false,
          canAccessConfidential: false,
        },
        {
          id: "gpt-3.5-turbo",
          name: "GPT-3.5 Turbo",
          description: "Fast and efficient OpenAI model",
          provider: "OpenAI",
          maxTokens: 4096,
          isAvailable: true,
          isLocal: false,
          canAccessConfidential: false,
        },
      ];
      setModels(mockModels);
      setDefaultModel('mistral');
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to load models');
      
      // Fallback to mock data
      const mockModels: Model[] = [
        {
          id: "mistral",
          name: "Mistral",
          description: "Local model - fast and efficient",
          provider: "Local",
          maxTokens: 4096,
          isAvailable: true,
          default: true,
          isLocal: true,
          canAccessConfidential: true,
        },
        {
          id: "llama3.1-8b-128k",
          name: "Llama 3.1 8B",
          description: "Advanced local model with 128K context window",
          provider: "Local",
          maxTokens: 128000,
          isAvailable: true,
          isLocal: true,
          canAccessConfidential: true,
        },
        {
          id: "qwen2.5-1m",
          name: "Qwen 2.5 1M",
          description: "Large context local model with 1M tokens - ideal for long documents",
          provider: "Local",
          maxTokens: 1000000,
          isAvailable: true,
          isLocal: true,
          canAccessConfidential: true,
        },
        {
          id: "gpt-4o",
          name: "GPT-4o",
          description: "Most capable OpenAI model",
          provider: "OpenAI",
          maxTokens: 8192,
          isAvailable: true,
          isLocal: false,
          canAccessConfidential: false,
        },
        {
          id: "gpt-3.5-turbo",
          name: "GPT-3.5 Turbo",
          description: "Fast and efficient OpenAI model",
          provider: "OpenAI",
          maxTokens: 4096,
          isAvailable: true,
          isLocal: false,
          canAccessConfidential: false,
        },
      ];
      setModels(mockModels);
      setDefaultModel('mistral');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Helper function to check if a model can access confidential data
  const canModelAccessConfidential = (modelId: string): boolean => {
    const model = models.find(m => m.id === modelId);
    return model?.canAccessConfidential ?? false;
  };

  // Helper function to get local models only
  const getLocalModels = (): Model[] => {
    return models.filter(model => model.isLocal);
  };

  // Helper function to get external models only
  const getExternalModels = (): Model[] => {
    return models.filter(model => !model.isLocal);
  };

  return {
    models,
    loading,
    error,
    defaultModel,
    refetch: fetchModels,
    canModelAccessConfidential,
    getLocalModels,
    getExternalModels,
  };
};
