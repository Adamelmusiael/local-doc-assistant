import React, { useState } from 'react';
import { File, ProcessingStatus } from '../../types';
import { useFile } from '../../contexts/FileContext';
import { simulateFileDownload } from '../../mock/fileUploadMocks';
import { fileAPI } from '../../services/api';
import { FileIcon, DeleteIcon, EyeIcon, DownloadIcon, CloseIcon } from '../icons';
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
    simulateFileDownload(file.originalName);
  };

  const handlePreview = (file: File) => {
    // Log debug information
    console.log('Preview clicked for file:', file);
    console.log('File ID:', file.id);
    console.log('Document ID:', file.documentId);
    
    // Validate document ID exists
    if (!file.documentId) {
      console.error('Document ID is missing for file:', file);
      alert('Error: Document ID is missing. Cannot preview file.');
      return;
    }
    
    // Open file preview in new tab using the backend preview endpoint
    const previewUrl = fileAPI.getPreviewUrl(file.documentId);
    console.log('Opening preview URL:', previewUrl);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  if (files.length === 0) {
    return (
      <div className="file-list">
        <div className="file-list__empty">
          <FileIcon size={64} />
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
                <DeleteIcon size={16} />
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
                <FileIcon size={24} />
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
                  <EyeIcon size={16} />
                </button>
                <button
                  className="file-list__action-btn"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <DownloadIcon size={16} />
                </button>
                <button
                  className="file-list__action-btn file-list__action-btn--delete"
                  onClick={() => {
                    setSelectedFiles(new Set([file.id]));
                    setShowDeleteModal(true);
                  }}
                  title="Delete"
                >
                  <DeleteIcon size={16} />
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
              <CloseIcon size={24} />
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