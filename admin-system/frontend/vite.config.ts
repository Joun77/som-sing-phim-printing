import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(import.meta.dirname, './node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, './node_modules/react-dom'),
      '@': path.resolve(import.meta.dirname, './src'),
      '@features': path.resolve(import.meta.dirname, './src/features'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@store': path.resolve(import.meta.dirname, './src/store'),
      '@types': path.resolve(import.meta.dirname, './src/types'),
      '@lib': path.resolve(import.meta.dirname, './src/lib'),
      '@utils': path.resolve(import.meta.dirname, './src/utils'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfjs-dist')) return 'vendor-pdf'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('react/') || id.includes('react-dom/')) return 'vendor-react'
          }
        },
      },
    },
  },
})


