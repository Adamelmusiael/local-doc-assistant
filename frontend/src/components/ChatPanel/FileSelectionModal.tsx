import React, { useState, useEffect } from 'react';
import { useFile } from '../../contexts/FileContext';
import { useChat } from '../../contexts/ChatContext';
import { useMenu } from '../../contexts/MenuContext';

interface FileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FileSelectionModal: React.FC<FileSelectionModalProps> = ({ isOpen, onClose }) => {
  const { state: fileState } = useFile();
  const { state: chatState, addSelectedFile, removeSelectedFile } = useChat();
  const [tempSelectedFiles, setTempSelectedFiles] = useState<string[]>(chatState.selectedFiles);
  const { closeAllMenus } = useMenu();

  // Close all menus when modal opens
  useEffect(() => {
    if (isOpen) {
      closeAllMenus();
    }
  }, [isOpen, closeAllMenus]);

  // Filter only completed files
  const availableFiles = fileState.files.filter(file => 
    file.processingStatus === 'completed'
  );

  const handleFileToggle = (fileId: string) => {
    setTempSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleApply = () => {
    // Clear current selection
    chatState.selectedFiles.forEach(fileId => removeSelectedFile(fileId));
    
    // Add new selection
    tempSelectedFiles.forEach(fileId => addSelectedFile(fileId));
    
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedFiles(chatState.selectedFiles);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="file-selection-modal">
      <div className="file-selection-modal__backdrop" onClick={handleCancel} />
      <div className="file-selection-modal__content">
        <div className="file-selection-modal__header">
          <h3>Select Files to Attach</h3>
          <button 
            className="file-selection-modal__close"
            onClick={handleCancel}
          >
            ×
          </button>
        </div>

        <div className="file-selection-modal__body">
          {availableFiles.length === 0 ? (
            <div className="file-selection-modal__empty">
              <p>No processed files available.</p>
              <p>Upload and process files first to attach them to messages.</p>
            </div>
          ) : (
            <div className="file-selection-modal__files">
              {availableFiles.map(file => (
                <div 
                  key={file.id}
                  className={`file-selection-modal__file ${
                    tempSelectedFiles.includes(file.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleFileToggle(file.id)}
                >
                  <div className="file-selection-modal__file-checkbox">
                    <input
                      type="checkbox"
                      checked={tempSelectedFiles.includes(file.id)}
                      onChange={() => handleFileToggle(file.id)}
                    />
                  </div>
                  <div className="file-selection-modal__file-info">
                    <div className="file-selection-modal__file-name">
                      {file.originalName}
                    </div>
                    <div className="file-selection-modal__file-meta">
                      {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                    </div>
                  </div>
                  <div className="file-selection-modal__file-status">
                    <span className="file-selection-modal__file-status-badge">
                      Processed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="file-selection-modal__footer">
          <button 
            className="file-selection-modal__btn file-selection-modal__btn--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="file-selection-modal__btn file-selection-modal__btn--apply"
            onClick={handleApply}
            disabled={tempSelectedFiles.length === 0}
          >
            Attach {tempSelectedFiles.length} file{tempSelectedFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSelectionModal;
