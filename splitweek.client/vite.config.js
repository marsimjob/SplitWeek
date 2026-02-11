import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 49754,
    proxy: {
      '/api': {
        target: 'http://localhost:5201',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
