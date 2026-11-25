import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './pruebas-aceptacion',
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:15173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.CHROMIUM_E2E || undefined },
  },
  webServer: [
    {
      command: 'bash pruebas-aceptacion/backend.sh',
      url: 'http://127.0.0.1:18080/api/health',
      timeout: 600_000,
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 15173 --strictPort',
      env: { VITE_DEV_API_TARGET: 'http://127.0.0.1:18080', VITE_API_URL: '' },
      url: 'http://127.0.0.1:15173',
      reuseExistingServer: false,
    },
  ],
})
