import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ✅ Makes the dev server accessible externally
    port: process.env.PORT || 5173, // ✅ Use Render's provided port or default to 5173
    allowedHosts: [
      'evnzon-solution-pvt-limited.onrender.com', // ✅ Your Render domain
      'localhost', // ✅ Local development
      '127.0.0.1'  // ✅ Local fallback
    ]
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 5173,
    allowedHosts: [
      'evnzon-solution-pvt-limited.onrender.com',
      'localhost',
      '127.0.0.1'
    ]
  }
})
