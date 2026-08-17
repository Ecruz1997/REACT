import { test, expect } from '@playwright/test';
import { login } from './_login';

// Solicitud sembrada de la sucursal B (ver src/lib/fixtures.ts)
const SOLICITUD_SUCURSAL_B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

test('analista de sucursal A no puede abrir una solicitud de sucursal B (IDOR)', async ({ page }) => {
  await login(page, 'ana.analista'); // sucursal central (A)
  await page.goto(`/solicitudes/${SOLICITUD_SUCURSAL_B}`);
  // Se comporta como inexistente: página "No encontrado".
  await expect(page.getByRole('heading', { name: /no encontrado/i })).toBeVisible();
});

test('analista no ve el botón de aprobar', async ({ page }) => {
  await login(page, 'ana.analista');
  await page.getByRole('link').filter({ hasText: /CRC|USD/ }).first().click();
  await expect(page.getByRole('button', { name: /^aprobar$/i })).toHaveCount(0);
});

test('el listado de un analista no incluye solicitudes de otra sucursal', async ({ page }) => {
  await login(page, 'ana.analista');
  await expect(page.locator('body')).not.toContainText('•••• 4321'); // últimos 4 de la cuenta de B
});
