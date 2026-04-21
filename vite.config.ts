import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // 强制所有环境下使用相对路径，对 Electron/Capacitor 更友好
    plugins: [
      react(), 
      tailwindcss(),
      // 仅在非原生环境下启用 PWA (可选，如果还是不行可以彻底注释掉)
      !process.env.IS_NATIVE && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'GeminiBot AI',
          short_name: 'GeminiBot',
          description: '专业且详尽的 AI 智能助手',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'https://picsum.photos/seed/gemini/192/192',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/seed/gemini/512/512',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      target: 'chrome80', // 提高安卓 WebView 兼容性
      cssTarget: 'chrome80',
      minify: 'esbuild',
      assetsInlineLimit: 0, // 强制导出文件，避免内联大资源在老机器上失败
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
