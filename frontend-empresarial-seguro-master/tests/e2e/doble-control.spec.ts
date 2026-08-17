import { test, expect } from '@playwright/test';
import { login } from './_login';

test('el auditor puede ver la bitácora; el analista no', async ({ page }) => {
  await login(page, 'dina.auditora');
  await page.goto('/auditoria');
  await expect(page.getByRole('heading', { name: /bitácora/i })).toBeVisible();
});

test('un analista que fuerza /auditoria es redirigido a no-autorizado', async ({ page }) => {
  await login(page, 'ana.analista');
  await page.goto('/auditoria');
  await expect(page).toHaveURL(/\/no-autorizado/);
});
