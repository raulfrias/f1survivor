import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Multi-page app configuration
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html')
      }
    },
    outDir: 'dist'
  },
  
  // Ensure assets are properly handled
  publicDir: 'public',
  
  // Base URL for production
  base: './'
}) 