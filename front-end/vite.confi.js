import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.js', '.jsx']
  },
  server: {
    port: 5173,
    historyApiFallback: true,
    proxy: {
      '/socket.io': {
        target: process.env.REACT_APP_API_URL || 'http://api-tetoChat:3005',
        changeOrigin: true,
        ws: true
      },
      '/api': {
        target: process.env.REACT_APP_API_URL || 'http://api-tetoChat:3005',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
