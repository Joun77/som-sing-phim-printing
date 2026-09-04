import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { ShopProvider } from './context/ShopContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/global.css'

const queryClient = new QueryClient()

// Auto-clean stale Service Workers and Cache Storage in dev mode
// This prevents having to use Cmd+Shift+R to force reload after SW is installed
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    if (registrations.length > 0) {
      // Unregister all SW registrations
      await Promise.all(registrations.map((r) => r.unregister()));
      // In dev mode: force a clean reload so Vite HMR takes over immediately
      if (import.meta.env.DEV) {
        window.location.reload();
      }
    }
  });

  // Also clear all caches in dev mode to prevent stale assets
  if (import.meta.env.DEV && 'caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <ShopProvider>
            <App />
          </ShopProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
