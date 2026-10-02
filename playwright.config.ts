import { defineConfig, devices } from '@playwright/test'

// E2E_WEB_PORT gives the tests a Vite of their own. scripts/run-e2e.sh sets it so a run
// never lands on the dev server an attendee is using on 5173. Unset, everything is as
// before: test localhost:5173 and reuse a server already running there.
const e2ePort = process.env['E2E_WEB_PORT']
const baseURL = e2ePort ? `http://127.0.0.1:${e2ePort}` : 'http://localhost:5173'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  retries: 0,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // --strictPort so a taken port fails the run instead of Vite moving to the next one.
    command: e2ePort
      ? `npm run dev -w @mmf/client -- --host 127.0.0.1 --port ${e2ePort} --strictPort`
      : 'npm run dev -w @mmf/client',
    url: baseURL,
    // With its own port, always start its own Vite: whatever already answers there is
    // not the E2E stack.
    reuseExistingServer: !e2ePort && !process.env['CI'],
  },
})
