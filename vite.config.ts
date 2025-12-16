import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'utils-vendor': ['uuid', 'crypto-js', 'js-yaml', 'ini', 'smol-toml', 'prismjs'],
          'pdf-vendor': ['pdf-lib', 'pdfjs-dist'],
          'ffmpeg-vendor': ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
        }
      }
    }
  },
  optimizeDeps: {
    // include: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  }
});
