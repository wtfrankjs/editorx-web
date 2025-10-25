import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Serve the app under /editor to work behind Next.js proxy and in production subpath
  base: '/editor/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          // Canvas and heavy components
          'canvas': [
            './src/components/CanvasRenderer.tsx',
            './src/components/Canvas/Layer.tsx',
            './src/components/Canvas/TransformHandles.tsx',
          ],
          // UI components
          'ui-modals': [
            './src/components/SettingsModal.tsx',
            './src/components/ProfileModal.tsx',
            './src/components/ExportDialog.tsx',
            './src/components/HistoryDrawer.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
