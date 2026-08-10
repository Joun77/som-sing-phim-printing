import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // NOTE: API calls go directly to http://localhost:8080 (CORS-enabled on the
    // Go backend), so no dev proxy is required. Use VITE_API_BASE_URL to override.
  },
})
