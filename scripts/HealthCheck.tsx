import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { chatAPI, fileAPI } from '../frontend/src/services/api';

interface HealthStatus {
  status: string;
  service?: string;
  message?: string;
  timestamp: string;
}

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'testing';
  message: string;
  timestamp: string;
}

const HealthCheck: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTestResult = (endpoint: string, status: 'success' | 'error', message: string) => {
    const result: TestResult = {
      endpoint,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const checkHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing health endpoint...');
      const response = await axios.get('/health');
      console.log('Health check response:', response.data);
      
      setHealthStatus({
        ...response.data,
        timestamp: new Date().toLocaleTimeString()
      });
      addTestResult('/health', 'success', 'Health check successful');
    } catch (err) {
      console.error('Health check failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMsg);
      addTestResult('/health', 'error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const testFileEndpoints = async () => {
    setIsLoading(true);
    try {
      console.log('Testing file list endpoint...');
      const response = await fileAPI.listFiles();
      console.log('File list response:', response);
      addTestResult('/docs/list_documents', 'success', `Found ${response.data?.length || 0} files`);
    } catch (err) {
      console.error('File list failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'File list failed';
      addTestResult('/docs/list_documents', 'error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const testChatEndpoints = async () => {
    setIsLoading(true);
    try {
      console.log('Testing chat sessions endpoint...');
      const response = await chatAPI.listChats();
      console.log('Chat sessions response:', response);
      addTestResult('/chat/chat_sessions', 'success', `Found ${response.data?.length || 0} chat sessions`);
    } catch (err) {
      console.error('Chat sessions failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Chat sessions failed';
      addTestResult('/chat/chat_sessions', 'error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRoot = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Testing root endpoint...');
      const response = await axios.get('/');
      console.log('Root endpoint response:', response.data);
      
      setHealthStatus({
        ...response.data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      console.error('Root endpoint failed:', err);
      setError(err instanceof Error ? err.message : 'Root endpoint failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check on component mount
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ddd', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>Backend Health Check</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={checkHealth} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Checking...' : 'Test /health'}
        </button>
        
        <button 
          onClick={checkRoot} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Checking...' : 'Test /'}
        </button>

        <button 
          onClick={testFileEndpoints} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Testing...' : 'Test Files API'}
        </button>

        <button 
          onClick={testChatEndpoints} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? ' Testing...' : ' Test Chat API'}
        </button>
      </div>

      {healthStatus && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>
             Backend is Healthy!
          </h3>
          <div><strong>Status:</strong> {healthStatus.status}</div>
          {healthStatus.service && <div><strong>Service:</strong> {healthStatus.service}</div>}
          {healthStatus.message && <div><strong>Message:</strong> {healthStatus.message}</div>}
          <div><strong>Checked at:</strong> {healthStatus.timestamp}</div>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#721c24', margin: '0 0 10px 0' }}>
             Backend Connection Failed
          </h3>
          <div><strong>Error:</strong> {error}</div>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
            <strong>Troubleshooting:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Make sure backend is running on port 8000</li>
              <li>Check if docker-compose is up: <code>docker-compose up</code></li>
              <li>Verify .env file configuration</li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </div>
        </div>
      )}

      {/* Test Results Section */}
      {testResults.length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}> API Test Results</h3>
          {testResults.map((result, index) => (
            <div 
              key={index}
              style={{ 
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: result.status === 'success' ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px'
              }}
            >
              <div style={{ 
                color: result.status === 'success' ? '#155724' : '#721c24',
                fontWeight: 'bold'
              }}>
                {result.status === 'success' ? '' : ''} {result.endpoint}
              </div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                {result.message} - {result.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#e7f3ff',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong> How the API fix works:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li><strong>/health</strong> → <code>GET http://localhost:8000/health</code></li>
          <li><strong>/docs/list_documents</strong> → <code>GET http://localhost:8000/docs/list_documents</code></li>
          <li><strong>/chat/chat_sessions</strong> → <code>GET http://localhost:8000/chat/chat_sessions</code></li>
          <li>Vite dev server proxies these requests to backend</li>
          <li>No more <code>/api</code> prefix - direct endpoint matching!</li>
        </ul>
      </div>
    </div>
  );
};

export default HealthCheck;
