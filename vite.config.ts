import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    allowedHosts: [
      'scanner-readily-workshop-ribbon.trycloudflare.com',
      'angola-intranet-finance-sold.trycloudflare.com',
      `investing-compound-provider-jul.trycloudflare.com`,
      `enb-geek-evaluated-estonia.trycloudflare.com`,
      "stick-collected-cat-exams.trycloudflare.com"
    ]
  },
});
