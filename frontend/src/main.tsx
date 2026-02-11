import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 24px var(--shadow-sm)',
            border: '1px solid var(--border-color)',
            transition: 'all 0.3s ease',
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: 'var(--toast-color)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff7f6e',
              secondary: 'var(--toast-color)',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
















