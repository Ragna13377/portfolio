import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/portfolio/',
  publicDir: 'src/assets/favicon',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/app/tests/setupMediaQuery.ts'],
  },
});
