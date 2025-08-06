import React from 'react';
import { Link } from 'react-router';
import Layout from '../components/Layout/Layout';
import './NotFound.scss';

const NotFound: React.FC = () => {
  return (
    <Layout>
      <div className="not-found-page">
        <div className="not-found-page__content">
          <div className="not-found-page__text">
            <div className="not-found-page__icon">
              <svg
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="not-found-page__title">404</h1>
            <h2 className="not-found-page__subtitle">Page Not Found</h2>
            <p className="not-found-page__description">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="not-found-page__actions">
            <Link to="/" className="not-found-page__button not-found-page__button--primary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              Go to Chat
            </Link>
            
            <Link to="/files" className="not-found-page__button not-found-page__button--secondary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
              Browse Files
            </Link>
          </div>
          
          <div className="not-found-page__help">
            <p className="not-found-page__help-text">
              Need help? Check if the backend is running by looking at the status indicator in the sidebar.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
