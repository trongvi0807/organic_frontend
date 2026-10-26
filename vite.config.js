import { build, defineConfig, loadEnv } from 'vite';
import { workerBuild } from './vite.sw.config.js';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  // Vite loads .env files after evaluating config, so load server-only values here.
  const env = loadEnv(mode, process.cwd(), 'DEV_');
  return {
    plugins: [react(), tailwindcss(), {
      name: 'moc-messaging-worker-dev',
      apply: 'serve',
      configureServer(server) {
        let compiled;
        server.watcher.on('change', (path) => { if (/firebase|notificationTarget/.test(path)) compiled = null; });
        server.middlewares.use('/firebase-messaging-sw.js', async (_req, res, next) => {
          try {
            compiled ||= build({ ...workerBuild, mode, build: { ...workerBuild.build, write: false } });
            const result = await compiled;
            const code = (Array.isArray(result) ? result[0] : result).output.find((chunk) => chunk.type === 'chunk').code;
            res.setHeader('Content-Type', 'application/javascript'); res.setHeader('Cache-Control', 'no-store'); res.end(code);
          } catch (err) { compiled = null; next(err); }
        });
      },
    }],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: env.DEV_API_TARGET || 'http://localhost:8088', changeOrigin: true } },
    },
    test: { environment: 'node', include: ['src/**/*.test.js'] },
  };
});
