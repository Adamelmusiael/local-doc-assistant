import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export interface HealthStatus {
  isHealthy: boolean;
  lastChecked: Date;
  error?: string;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private checkInterval: number | null = null;
  private listeners: ((status: HealthStatus) => void)[] = [];
  private currentStatus: HealthStatus = {
    isHealthy: false,
    lastChecked: new Date(),
  };

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      // Use a shorter timeout for health checks
      const response = await axios.get(`${BASE_URL}/health`, {
        timeout: 3000, // 3 second timeout
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const isHealthy = response.status === 200 && response.data?.status === 'healthy';
      
      this.currentStatus = {
        isHealthy,
        lastChecked: new Date(),
        error: isHealthy ? undefined : 'Invalid response from server',
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          errorMessage = 'Backend server not reachable';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout';
        } else if (error.response) {
          errorMessage = `Server error: ${error.response.status}`;
        } else {
          errorMessage = error.message || 'Network error';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      this.currentStatus = {
        isHealthy: false,
        lastChecked: new Date(),
        error: errorMessage,
      };
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener(this.currentStatus));
    
    return this.currentStatus;
  }

  startPeriodicChecks(intervalMs: number = 10000): void {
    // Stop any existing interval
    this.stopPeriodicChecks();
    
    // Initial check
    this.checkHealth();
    
    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  subscribe(listener: (status: HealthStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current status
    listener(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getCurrentStatus(): HealthStatus {
    return this.currentStatus;
  }
}

export const healthCheckService = HealthCheckService.getInstance();
