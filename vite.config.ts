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
    // Increase chunk size limit since we're splitting properly
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Core dependencies that go into vendor
          if (id.includes('/react/') || id.includes('/react-dom/')) return;
          
          // Routing
          if (id.includes('/react-router-dom/')) return 'router';

          // UI / animation - Radix and motion are core UI
          if (id.includes('/@radix-ui/')) return 'radix';
          if (id.includes('/framer-motion/')) return 'motion';

          // Heavy editors / canvas
          if (id.includes('/@tiptap/')) return 'tiptap';
          if (id.includes('/quill/') || id.includes('/react-quill/')) return 'quill';
          if (id.includes('/@excalidraw/')) return 'excalidraw';
          
          // Canvas and drag-drop libraries
          if (id.includes('/react-moveable/') || id.includes('/react-selecto/')) {
            return 'canvas';
          }
          if (id.includes('/@dnd-kit/')) return 'dnd';

          // Charts - keep both separate as they're large
          if (id.includes('/echarts/') || id.includes('/echarts-for-react/')) return 'charts';
          if (id.includes('/recharts/')) return 'recharts';

          // Data / APIs
          if (id.includes('/@supabase/')) return 'supabase';
          if (id.includes('/openai/')) return 'openai';
          if (id.includes('/zod/')) return 'zod';

          // Icons - lucide is much smaller than react-icons
          if (id.includes('/lucide-react/')) return 'icons';

          // PDF stack
          if (id.includes('/pdfjs-dist/') || id.includes('/pdf-parse/')) return 'pdf';

          // Everything else in vendor
          return 'vendor';
        },
      },
    },
  },
});
