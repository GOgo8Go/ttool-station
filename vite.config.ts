import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // 将大型依赖分别打包成独立chunk
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ui-vendor': ['lucide-react'],
              'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
              'utils-vendor': ['uuid', 'crypto-js', 'js-yaml', 'ini', 'smol-toml', 'prismjs'],
              'pdf-vendor': ['pdf-lib', 'pdfjs-dist'],
              'image-vendor': ['html2canvas', 'exifreader', 'qrcode', 'jsbarcode', 'html5-qrcode'],
              'archive-vendor': ['@zip.js/zip.js'],
              'diff-vendor': ['diff']
            }
          }
        },
        chunkSizeWarningLimit: 1000 // 将警告限制提高到1000kB
      }
    };
});