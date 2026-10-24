import { defineConfig } from 'vite';

export default defineConfig({
  // src/pond.js uses top-level await (loads the model, waits for the first season to draw)
  build: { target: 'esnext' },
});
