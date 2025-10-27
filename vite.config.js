import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',             // Make sure it's accessible externally
    port: process.env.PORT || 5173,
    allowedHosts: [
      'event-zone-admin-dashboard.onrender.com'  // ✅ Add your Render domain here
    ]
  }
})
