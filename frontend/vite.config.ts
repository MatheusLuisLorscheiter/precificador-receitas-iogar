import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Copiar arquivo _redirects para o build
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  // Configuração para desenvolvimento local
  server: {
    port: 3000,
    historyApiFallback: true,
  }
})