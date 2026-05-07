import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: '127.0.0.1',
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Keep React in main bundle - don't separate it
          // Everything depends on React, so separating it causes loading issues

          // Routing
          if (id.includes('/react-router-dom/')) return 'router';

          // UI / animation
          if (id.includes('/@radix-ui/')) return 'radix';
          if (id.includes('/framer-motion/')) return 'motion';

          // Editors / canvas-y things
          if (id.includes('/@tiptap/')) return 'tiptap';
          if (id.includes('/quill/') || id.includes('/react-quill/')) return 'quill';
          if (id.includes('/@excalidraw/')) return 'excalidraw';
          if (id.includes('/react-moveable/') || id.includes('/react-selecto/') || id.includes('/@dnd-kit/')) {
            return 'canvas';
          }

          // Charts
          if (id.includes('/echarts/') || id.includes('/echarts-for-react/')) return 'charts';
          if (id.includes('/recharts/')) return 'recharts';

          // Data / APIs
          if (id.includes('/@supabase/')) return 'supabase';
          if (id.includes('/openai/')) return 'openai';
          if (id.includes('/zod/')) return 'zod';

          // Icon packs can be surprisingly large
          if (id.includes('/react-icons/')) return 'icons';
          if (id.includes('/lucide-react/')) return 'icons';

          // PDF stack can be very large
          if (id.includes('/pdfjs-dist/') || id.includes('/pdf-parse/')) return 'pdf';

          // Everything else
          return 'vendor';
        },
      },
    },
  },
});
