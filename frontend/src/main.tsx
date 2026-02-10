// main.tsx - Entry Point React
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#202C33',
          color: '#E9EDEF',
          border: '1px solid #2A3942',
          borderRadius: '10px',
          fontSize: '13px',
        },
        success: {
          iconTheme: { primary: '#25D366', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#FF6B6B', secondary: '#fff' },
        },
      }}
    />
  </React.StrictMode>,
)