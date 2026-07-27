// ==============================================================================
// STUDENT PERFORMANCE PREDICTION SYSTEM - VITE CONFIGURATION
// ==============================================================================
// Purpose of File: Bundler and dev-server configuration for Vite + React 19 + TypeScript.
//                   Sets up path alias '@' to 'src/', dev server port (5173), and HTTP proxy
//                   forwarding API requests to FastAPI backend (http://localhost:8000).
// ==============================================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
