import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Multi-page app configuration
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'src/pages/dashboard.html')
      }
    },
    outDir: 'dist'
  },
  
  // Development server configuration
  server: {
    // Handle routing for SPA-like behavior
    historyApiFallback: true
  },
  
  // Ensure assets are properly handled
  publicDir: 'public',
  
  // Base URL for production
  base: './',
  
  // Path aliases for clean imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@tests': resolve(__dirname, 'tests'),
      '@docs': resolve(__dirname, 'docs'),
      '@scripts': resolve(__dirname, 'scripts'),
      '@config': resolve(__dirname, 'config')
    }
  }
}) 