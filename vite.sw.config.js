import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export const workerBuild = {
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  build: {
    emptyOutDir: false,
    lib: { entry: fileURLToPath(new URL('./src/firebase-messaging-sw.js', import.meta.url)), name: 'MocMessagingWorker', formats: ['iife'], fileName: () => 'firebase-messaging-sw.js' },
  },
};
export default defineConfig(workerBuild);
