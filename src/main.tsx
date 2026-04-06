import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logger } from '@/lib/logger';
import './index.css';

if (import.meta.env.DEV) {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught frontend error', event.error, {
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason);
  });

  logger.info('Frontend dev logging enabled', {
    apiBase: import.meta.env.VITE_PPT_API_URL || 'http://localhost:8000',
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
