/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative asset paths so GitHub Pages subpaths load correctly
  test: {
    globals: true,
    environment: 'node',
  },
});
