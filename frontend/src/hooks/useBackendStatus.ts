import { useState, useEffect, useCallback } from 'react';
import { healthCheckService, HealthStatus } from '../services/healthCheck';

export interface UseBackendStatusReturn {
  isHealthy: boolean;
  lastChecked: Date;
  error?: string;
  isChecking: boolean;
  checkNow: () => Promise<void>;
}

export const useBackendStatus = (enableAutoCheck: boolean = true): UseBackendStatusReturn => {
  const [status, setStatus] = useState<HealthStatus>(healthCheckService.getCurrentStatus());
  const [isChecking, setIsChecking] = useState(false);

  const checkNow = useCallback(async () => {
    setIsChecking(true);
    try {
      await healthCheckService.checkHealth();
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe to health status updates
    const unsubscribe = healthCheckService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    // Start periodic checks if enabled
    if (enableAutoCheck) {
      healthCheckService.startPeriodicChecks(10000); // Check every 10 seconds
    }

    // Cleanup
    return () => {
      unsubscribe();
      if (enableAutoCheck) {
        healthCheckService.stopPeriodicChecks();
      }
    };
  }, [enableAutoCheck]);

  return {
    isHealthy: status.isHealthy,
    lastChecked: status.lastChecked,
    error: status.error,
    isChecking,
    checkNow,
  };
};
