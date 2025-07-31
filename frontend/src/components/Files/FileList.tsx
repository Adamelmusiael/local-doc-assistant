import React, { useState } from 'react';
import { File, ProcessingStatus } from '../../types';
import { useFile } from '../../contexts/FileContext';
import './FileList.scss';

interface FileListProps {
  files: File[];
}

const FileList: React.FC<FileListProps> = ({ files }) => {
  const { deleteFile } = useFile();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const handleFileSelect = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    selectedFiles.forEach(fileId => {
      deleteFile(fileId);
    });
    setSelectedFiles(new Set());
    setShowDeleteModal(false);
  };

  const handleDownload = (file: File) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['Simulated file content']));
    link.download = file.originalName;
    link.click();
  };

  const handlePreview = (file: File) => {
    // Simulate preview - in real app this would open a modal or new tab
    window.open(`/api/files/${file.id}/preview`, '_blank');
  };

  if (files.length === 0) {
    return (
      <div className="file-list">
        <div className="file-list__empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          <h3 className="file-list__empty-title">No files uploaded yet</h3>
          <p className="file-list__empty-subtitle">
            Upload your first document to get started with file management
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list">
      {/* Header with bulk actions */}
      {files.length > 0 && (
        <div className="file-list__header">
          <div className="file-list__header-left">
            <label className="file-list__select-all">
              <input
                type="checkbox"
                checked={selectedFiles.size === files.length}
                onChange={handleSelectAll}
              />
              <span>Select All</span>
            </label>
            {selectedFiles.size > 0 && (
              <span className="file-list__selected-count">
                {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          {selectedFiles.size > 0 && (
            <div className="file-list__header-right">
              <button
                className="file-list__bulk-delete-btn"
                onClick={handleDelete}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                </svg>
                Delete Selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* File list */}
      <div className="file-list__content">
        {files.map((file) => (
          <div key={file.id} className="file-list__item">
            <div className="file-list__item-left">
              <label className="file-list__checkbox">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => handleFileSelect(file.id)}
                />
              </label>
              <div className="file-list__file-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <div className="file-list__file-info">
                <div className="file-list__file-name">{file.originalName}</div>
                <div className="file-list__file-meta">
                  <span className="file-list__file-size">{formatFileSize(file.size)}</span>
                  <span className="file-list__file-date">{formatDate(file.uploadDate)}</span>
                </div>
              </div>
            </div>

            <div className="file-list__item-center">
              <div className="file-list__file-status">
                <span
                  className="file-list__status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(file.processingStatus) + '20',
                    color: getStatusColor(file.processingStatus)
                  }}
                >
                  {getStatusText(file.processingStatus)}
                </span>
              </div>
              <div className="file-list__file-privacy">
                <span className={`file-list__privacy-badge ${file.isPublic ? 'public' : 'confidential'}`}>
                  {file.isPublic ? 'Public' : 'Confidential'}
                </span>
              </div>
            </div>

            <div className="file-list__item-right">
              <div className="file-list__actions">
                <button
                  className="file-list__action-btn"
                  onClick={() => handlePreview(file)}
                  title="Preview"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button
                  className="file-list__action-btn"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button
                  className="file-list__action-btn file-list__action-btn--delete"
                  onClick={() => {
                    setSelectedFiles(new Set([file.id]));
                    setShowDeleteModal(true);
                  }}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="file-list__delete-modal">
          <div className="file-list__delete-content">
            <div className="file-list__delete-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <h3 className="file-list__delete-title">Delete Files</h3>
            </div>
            <p className="file-list__delete-message">
              Are you sure you want to delete {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''}? 
              This action cannot be undone and will also delete all associated chunks and metadata.
            </p>
            <div className="file-list__delete-actions">
              <button
                className="file-list__delete-btn file-list__delete-btn--cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="file-list__delete-btn file-list__delete-btn--confirm"
                onClick={confirmDelete}
              >
                Delete Files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList; 