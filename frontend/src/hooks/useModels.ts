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
      const response = await modelAPI.getModels() as unknown as ModelsResponse;
      
      if (response.models) {
        setModels(response.models);
        if (response.default_model) {
          setDefaultModel(response.default_model);
        }
      } else {
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
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            description: "Most capable OpenAI model",
            provider: "OpenAI",
            maxTokens: 8192,
            isAvailable: true,
          },
          {
            id: "gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            description: "Fast and efficient OpenAI model",
            provider: "OpenAI",
            maxTokens: 4096,
            isAvailable: true,
          },
        ];
        setModels(mockModels);
      }
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
        },
        {
          id: "gpt-4o",
          name: "GPT-4o",
          description: "Most capable OpenAI model",
          provider: "OpenAI",
          maxTokens: 8192,
          isAvailable: true,
        },
        {
          id: "gpt-3.5-turbo",
          name: "GPT-3.5 Turbo",
          description: "Fast and efficient OpenAI model",
          provider: "OpenAI",
          maxTokens: 4096,
          isAvailable: true,
        },
      ];
      setModels(mockModels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    loading,
    error,
    defaultModel,
    refetch: fetchModels,
  };
};
