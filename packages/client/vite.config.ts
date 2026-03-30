import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-3d': [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            'postprocessing',
            '@react-three/postprocessing',
          ],
          'vendor-d3': ['d3'],
        },
      },
    },
  },
});
