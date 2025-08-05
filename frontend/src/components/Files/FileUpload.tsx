import React, { useState, useRef, useCallback } from 'react';
import { useFile } from '../../contexts/FileContext';
import { ProcessingStatus } from '../../types';
import { 
  FileWithProgress, 
  simulateFileProcessing, 
  getProcessingPhaseLabel 
} from '../../mock/fileUploadMocks';
import './FileUpload.scss';

interface FileUploadProps {
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onClose }) => {
  const { uploadFile } = useFile();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithProgress[]>([]);
  const [privacySetting, setPrivacySetting] = useState<'public' | 'confidential'>('public');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }
    if (file.size > 50 * 1024 * 1024) {
      return 'File size must be less than 50MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((files: FileList) => {
    const newFiles: FileWithProgress[] = [];
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }
      newFiles.push({
        file,
        progress: 0,
        status: ProcessingStatus.PENDING,
        processingPhase: 'upload'
      });
    });
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const retryProcessing = async (index: number) => {
    setSelectedFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: ProcessingStatus.PENDING, error: undefined } : f
    ));

    try {
      await handleUpload(index);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleUpload = async (index?: number) => {
    const filesToUpload = typeof index === 'number' 
      ? [selectedFiles[index]]
      : selectedFiles;

    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const currentIndex = typeof index === 'number' ? index : i;
        const fileWithProgress = selectedFiles[currentIndex];
        
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === currentIndex ? { 
            ...f, 
            status: ProcessingStatus.PROCESSING,
            processingPhase: 'upload'
          } : f
        ));

        // Simulate file processing phases
        await simulateFileProcessing(currentIndex, setSelectedFiles);

        // Upload file - convert browser File to our File type
        const fileData = {
          name: fileWithProgress.file.name,
          size: fileWithProgress.file.size,
          type: fileWithProgress.file.type
        };
        await uploadFile(fileData as any, privacySetting === 'public', privacySetting === 'confidential');
        
        setSelectedFiles(prev => prev.map((f, idx) => 
          idx === currentIndex ? { 
            ...f, 
            status: ProcessingStatus.COMPLETED,
            processingPhase: undefined,
            progress: 100
          } : f
        ));
      }

      setTimeout(() => {
        onClose();
        setSelectedFiles([]);
        setIsUploading(false);
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      const currentIndex = typeof index === 'number' ? index : selectedFiles.length - 1;
      setSelectedFiles(prev => prev.map((f, idx) => 
        idx === currentIndex ? { 
          ...f, 
          status: ProcessingStatus.FAILED, 
          error: 'Processing failed. Click to retry.',
          processingPhase: undefined
        } : f
      ));
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: ProcessingStatus): string => {
    switch (status) {
      case ProcessingStatus.COMPLETED:
        return '#059669';
      case ProcessingStatus.FAILED:
        return '#dc2626';
      case ProcessingStatus.PROCESSING:
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: ProcessingStatus): string => {
    switch (status) {
      case ProcessingStatus.COMPLETED:
        return 'Completed';
      case ProcessingStatus.FAILED:
        return 'Failed';
      case ProcessingStatus.PROCESSING:
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="file-upload">
      <div className="file-upload__header">
        <h2 className="file-upload__title">Upload Files</h2>
        <button className="file-upload__close-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="file-upload__content">
        <div
          className={`file-upload__drop-zone ${isDragOver ? 'file-upload__drop-zone--active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="file-upload__drop-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <h3 className="file-upload__drop-title">Drop files here or click to browse</h3>
            <p className="file-upload__drop-subtitle">
              Only PDF files are supported (max 50MB per file)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileInputChange}
            className="file-upload__file-input"
          />
        </div>

        <div className="file-upload__privacy">
          <h4 className="file-upload__privacy-title">Privacy Settings</h4>
          <div className="file-upload__privacy-options">
            <label className="file-upload__privacy-option">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={privacySetting === 'public'}
                onChange={(e) => setPrivacySetting(e.target.value as 'public' | 'confidential')}
              />
              <span className="file-upload__privacy-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                Public
              </span>
              <span className="file-upload__privacy-description">
                File will be available for all users
              </span>
            </label>
            <label className="file-upload__privacy-option">
              <input
                type="radio"
                name="privacy"
                value="confidential"
                checked={privacySetting === 'confidential'}
                onChange={(e) => setPrivacySetting(e.target.value as 'public' | 'confidential')}
              />
              <span className="file-upload__privacy-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Confidential
              </span>
              <span className="file-upload__privacy-description">
                File will only be available to you
              </span>
            </label>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="file-upload__files">
            <h4 className="file-upload__files-title">Selected Files ({selectedFiles.length})</h4>
            <div className="file-upload__files-list">
              {selectedFiles.map((fileWithProgress, index) => (
                <div key={index} className="file-upload__file-item">
                  <div className="file-upload__file-info">
                    <div className="file-upload__file-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                    </div>
                    <div className="file-upload__file-details">
                      <span className="file-upload__file-name">{fileWithProgress.file.name}</span>
                      <span className="file-upload__file-size">{formatFileSize(fileWithProgress.file.size)}</span>
                    </div>
                  </div>
                  
                  <div className="file-upload__file-status">
                    <div className="file-upload__progress-container">
                      <div 
                        className="file-upload__progress-bar"
                        style={{ width: `${fileWithProgress.progress}%` }}
                      />
                    </div>
                    <div className="file-upload__status-info">
                      {fileWithProgress.status === ProcessingStatus.PROCESSING && (
                        <span className="file-upload__processing-phase">
                          {getProcessingPhaseLabel(fileWithProgress.processingPhase)}
                        </span>
                      )}
                      <span 
                        className="file-upload__status-text"
                        style={{ color: getStatusColor(fileWithProgress.status) }}
                      >
                        {fileWithProgress.error || getStatusText(fileWithProgress.status)}
                      </span>
                    </div>
                  </div>

                  {fileWithProgress.status === ProcessingStatus.FAILED ? (
                    <button
                      className="file-upload__retry-btn"
                      onClick={() => retryProcessing(index)}
                      title="Retry processing"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2v6h-6"/>
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                        <path d="M3 22v-6h6"/>
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                      </svg>
                    </button>
                  ) : (
                    <button
                      className="file-upload__remove-btn"
                      onClick={() => removeFile(index)}
                      disabled={fileWithProgress.status === ProcessingStatus.PROCESSING}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="file-upload__actions">
            <button
              className="file-upload__upload-btn"
              onClick={() => handleUpload()}
              disabled={isUploading}
            >
              {isUploading ? 'Processing...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;