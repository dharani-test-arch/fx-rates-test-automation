import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The browser always talks to /graphql on its own origin; Vite forwards it to the
// local Apollo server. This avoids CORS and gives tests one stable URL to intercept.
const proxy = {
  '/graphql': {
    target: process.env.GRAPHQL_TARGET ?? 'http://localhost:4000',
    rewrite: () => '/',
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
