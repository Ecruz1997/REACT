import { defineConfig, devices } from '@playwright/test';

// E2E de Bóveda. Levanta la app en modo producción con una base sembrada y aislada.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Siembra una base de prueba dedicada y arranca el server ya construido.
    command: 'BOVEDA_DB=e2e.db npx tsx db/seed.ts && BOVEDA_DB=e2e.db PORT=3100 npx next start -p 3100',
    url: 'http://localhost:3100/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { SESSION_SECRET: 'e2e-secreto-suficientemente-largo-1234567890', NODE_ENV: 'production' },
  },
});
