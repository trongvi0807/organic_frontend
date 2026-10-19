import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  // Vite loads .env files after evaluating config, so load server-only values here.
  const env = loadEnv(mode, process.cwd(), 'DEV_');
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      proxy: { '/api': { target: env.DEV_API_TARGET || 'http://localhost:8088', changeOrigin: true } },
    },
    test: { environment: 'node', include: ['src/**/*.test.js'] },
  };
});
