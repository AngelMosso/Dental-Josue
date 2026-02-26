import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // Escuchar en todas las interfaces (0.0.0.0)
    port: 5173,
    allowedHosts: true,
    cors: true,
    // HMR dinámico: funciona en red local (WiFi) y también con localtunnel
    hmr: true
  }
})

