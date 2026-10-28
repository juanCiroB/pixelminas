import { defineConfig } from 'vite';

// base './' para que las rutas funcionen dentro del WebView de Capacitor
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
});
