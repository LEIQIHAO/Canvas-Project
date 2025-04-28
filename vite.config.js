import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'node:path';
import fs from 'node:fs';

const pathSrc = path.resolve(__dirname, 'src');

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables', 'src/stores'],
      vueTemplate: true,
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': pathSrc,
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        globalVars: {
          'primary-color': '#42b883',
          'primary-color-light': '#63c295',
          'primary-color-dark': '#369e6c',
          'text-color': '#2c3e50',
          'text-color-light': '#606c7c',
          'text-color-placeholder': '#a0aec0',
          'bg-color': '#ffffff',
          'bg-color-light': '#f8f8f8',
          'bg-color-gray': '#f5f5f5',
          'border-color': '#e4e7ed',
          'border-color-light': '#ebeef5',
          'success-color': '#67c23a',
          'warning-color': '#e6a23c',
          'error-color': '#f56c6c',
          'info-color': '#909399',
          'font-size-small': '12px',
          'font-size-base': '14px',
          'font-size-medium': '16px',
          'font-size-large': '18px',
          'font-size-xlarge': '20px',
          'spacing-mini': '4px',
          'spacing-small': '8px',
          'spacing-base': '16px',
          'spacing-large': '24px',
          'spacing-xlarge': '32px',
          'border-radius-small': '2px',
          'border-radius-base': '4px',
          'border-radius-large': '8px',
          'box-shadow-base': '0 2px 4px rgba(0, 0, 0, 0.1)',
          'box-shadow-medium': '0 2px 8px rgba(0, 0, 0, 0.15)',
          'box-shadow-large': '0 4px 12px rgba(0, 0, 0, 0.15)',
          'transition-time': '0.3s',
          'transition-ease': 'ease-in-out',
        },
        modifyVars: {},
        additionalData: `
          @import "${pathSrc}/styles/variables.less";
          @import "${pathSrc}/styles/global-mixins.less";
        `,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  optimizeDeps: {
    include: ['crypto-js', 'dayjs'],
  },
  build: {
    commonjsOptions: {
      include: [
        /crypto-js/,
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/dayjs.min.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/customParseFormat.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/localeData.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/advancedFormat.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/weekOfYear.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/weekYear.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/dayOfYear.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/isSameOrAfter.js',
        'node_modules/.pnpm/dayjs@1.11.4/node_modules/dayjs/plugin/isSameOrBefore.js',
        'node_modules/.pnpm/escape-html@1.0.3/node_modules/escape-html/index.js',
      ],
    },
    minify: 'terser',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          elementPlus: ['element-plus', '@element-plus/icons-vue', 'dayjs'],
          utils: ['axios', 'dayjs', 'crypto-js'],
        },
      },
    },
  },
});
