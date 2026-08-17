import { defineConfig, devices } from '@playwright/test';

// Apunta a la app del estudiante YA corriendo en BASE_URL.
// El instructor levanta la entrega (npm run build && npm start) y luego corre este suite.
export default defineConfig({
  testDir: '.',
  testMatch: 'acceptance.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '.report/e2e.json' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
