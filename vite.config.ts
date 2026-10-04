import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/portfolio/',
  publicDir: false,
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
