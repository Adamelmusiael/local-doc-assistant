import React from 'react';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import './BackendStatusIndicator.scss';

interface BackendStatusIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

const BackendStatusIndicator: React.FC<BackendStatusIndicatorProps> = ({
  size = 'medium',
  showTooltip = true,
  className = '',
}) => {
  const { isHealthy, lastChecked, error, isChecking } = useBackendStatus();

  const getStatusText = () => {
    if (isChecking) return 'Checking backend status...';
    if (isHealthy) return 'Backend is running';
    return `Backend is not responding${error ? `: ${error}` : ''}`;
  };

  const getStatusClass = () => {
    if (isChecking) return 'checking';
    return isHealthy ? 'healthy' : 'unhealthy';
  };

  const formatLastChecked = () => {
    const now = new Date();
    const diff = now.getTime() - lastChecked.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div 
      className={`backend-status-indicator backend-status-indicator--${size} ${className}`}
      title={showTooltip ? `${getStatusText()} (Last checked: ${formatLastChecked()})` : undefined}
    >
      <div className={`backend-status-indicator__dot backend-status-indicator__dot--${getStatusClass()}`}>
        {isChecking && (
          <div className="backend-status-indicator__pulse" />
        )}
      </div>
    </div>
  );
};

export default BackendStatusIndicator;
