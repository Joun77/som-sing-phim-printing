import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { setupGlobalFetchInterceptor } from './api/client'

// Initialize centralized JWT bearer token interceptor for all fetch requests
setupGlobalFetchInterceptor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

