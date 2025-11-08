import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue core
          'vue-vendor': ['vue'],

          // Core UI components (used immediately)
          'ui-core': [
            './components/AmigaWindow.vue',
            './components/AmigaFolder.vue',
            './components/AmigaContextMenu.vue',
            './components/AmigaWorkspaceSwitcher.vue',
            './components/AmigaCommandPalette.vue',
            './components/SmartFolderItem.vue'
          ],

          // Utilities and managers
          'utils': [
            './utils/keyboard-manager.ts',
            './utils/theme-manager.ts',
            './utils/accessibility-manager.ts',
            './utils/workspace-manager.ts',
            './utils/clipboard-manager.ts',
            './utils/command-palette.ts'
          ],

          // Visualization components
          'visualizations': [
            './components/visualizations/AmigaPieChart.vue',
            './components/visualizations/AmigaLineChart.vue',
            './components/visualizations/AmigaTreeMap.vue'
          ],

          // Third-party libraries
          'vendor-libs': [
            'html2canvas',
            'jszip',
            'prismjs'
          ]
        },
      },
    },
  },
});
