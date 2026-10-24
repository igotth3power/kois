import { defineConfig } from 'vite';

export default defineConfig({
  // src/pond.js dùng top-level await (nạp model, chờ mùa đầu tiên vẽ xong)
  build: { target: 'esnext' },
});
