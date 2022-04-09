import { defineConfig, } from 'vite';
import vue from '@vitejs/plugin-vue';
import node from 'rollup-plugin-node-resolve';
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/__rpc__/connection': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
      '/__egg__': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: [{
      find: /^@\//,
      replacement: '/src/',
    }],
  },
  plugins: [vue(), glsl()],
  base: '/',
  build: {
    outDir: '../dist/ide',
    emptyOutDir: true,
    // only for debug
    minify: process.env.NODE_ENV === 'production',
    rollupOptions: {
      plugins: [
        node(),
      ],
    }
  }
});
