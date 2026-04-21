import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', 
    plugins: [
      react(), 
      legacy({
        targets: ['chrome >= 70'], // 强制支持旧版 Chrome
        additionalLegacyPolyfills: ['regenerator-runtime/runtime']
      }),
      // 仅在非原生环境下启用 PWA
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
      target: 'chrome70', 
      cssTarget: 'chrome70',
      minify: 'terser', // 改回普通压缩或terser，避免未知编译器问题
      assetsInlineLimit: 0,
      cssCodeSplit: false,
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
