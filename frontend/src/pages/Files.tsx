import React, { useState } from 'react';
import { useFile } from '../contexts/FileContext';
import FileUpload from '../components/Files/FileUpload';
import FileList from '../components/Files/FileList';
import Layout from '../components/Layout/Layout';
import './files.scss';

const Files: React.FC = () => {
  const { state: fileState } = useFile();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <Layout>
      <div className="files-page">
        <div className="files-page__header">
          <div className="files-page__header-left">
            <h1 className="files-page__title">Files</h1>
            <p className="files-page__subtitle">
              Manage your documents and upload new files for processing
            </p>
          </div>
          <div className="files-page__header-right">
            <button
              className="files-page__upload-btn"
              onClick={() => setShowUpload(!showUpload)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Upload Files
            </button>
          </div>
        </div>

        {showUpload && (
          <div className="files-page__upload-section">
            <FileUpload onClose={() => setShowUpload(false)} />
          </div>
        )}

        <div className="files-page__content">
          <FileList files={fileState.files} />
        </div>
      </div>
    </Layout>
  );
};

export default Files;
