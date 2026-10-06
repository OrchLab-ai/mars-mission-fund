/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Where /v1 is forwarded. The dev API is on 3001; scripts/run-e2e.sh points this at the
// E2E API on its own port, so an E2E run never reaches the attendee's running app.
const apiTarget = process.env['API_PROXY_TARGET'] ?? 'http://localhost:3001'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/v1': apiTarget,
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['server/**', 'packages/**', 'node_modules/**'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
      thresholds: {
        'src/components/ui/Button.tsx': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
})
