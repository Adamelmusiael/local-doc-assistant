import React from 'react';
import { SecurityIcon, BlockIcon } from '../icons';
import './ConfidentialFileWarningModal.scss';

interface ConfidentialFileWarningModalProps {
  isOpen: boolean;
  confidentialFiles: string[];
  modelName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfidentialFileWarningModal: React.FC<ConfidentialFileWarningModalProps> = ({
  isOpen,
  confidentialFiles,
  modelName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const fileCount = confidentialFiles.length;
  const fileText = fileCount === 1 ? 'file' : 'files';

  return (
    <div className="confidential-warning-modal-overlay">
      <div className="confidential-warning-modal">
        <div className="confidential-warning-modal__header">
          <div className="confidential-warning-modal__icon">
            <SecurityIcon size={24} />
          </div>
          <h3 className="confidential-warning-modal__title">
            Confidential Content Warning
          </h3>
        </div>

        <div className="confidential-warning-modal__content">
          <p className="confidential-warning-modal__message">
            You have attached <strong>{fileCount} confidential {fileText}</strong> and selected{' '}
            <strong>{modelName}</strong>, which is an external model.
          </p>

          <div className="confidential-warning-modal__files">
            <p className="confidential-warning-modal__files-title">
              Confidential {fileText}:
            </p>
            <ul className="confidential-warning-modal__files-list">
              {confidentialFiles.map((fileName, index) => (
                <li key={index} className="confidential-warning-modal__file-item">
                  <SecurityIcon size={16} />
                  <span>{fileName}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="confidential-warning-modal__warning">
            <BlockIcon size={20} />
            <div>
              <p><strong>Security Notice:</strong></p>
              <p>
                External models may store and process your data on external servers. 
                For maximum security, consider using a local model instead.
              </p>
            </div>
          </div>

          <p className="confidential-warning-modal__question">
            Do you want to proceed with these confidential files, or remove them?
          </p>
        </div>

        <div className="confidential-warning-modal__actions">
          <button
            className="confidential-warning-modal__btn confidential-warning-modal__btn--cancel"
            onClick={onCancel}
          >
            Remove Files
          </button>
          <button
            className="confidential-warning-modal__btn confidential-warning-modal__btn--confirm"
            onClick={onConfirm}
          >
            Keep Files & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfidentialFileWarningModal;
