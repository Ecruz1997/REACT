import { test, expect } from '@playwright/test';
import { login } from './_login';

test('las cookies de sesión tienen los flags correctos', async ({ page, context }) => {
  await login(page, 'ana.analista');
  const cookies = await context.cookies();
  const access = cookies.find((c) => c.name === 'boveda_access');
  expect(access, 'debe existir la cookie de access').toBeTruthy();
  expect(access!.httpOnly).toBe(true);
  expect(access!.sameSite).toBe('Lax');
});

test('credenciales inválidas muestran mensaje uniforme y no autentican', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('ana.analista');
  await page.getByLabel('Contraseña').fill('incorrecta-xyz');
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page.getByRole('alert')).toContainText(/incorrect/i);
  await expect(page).toHaveURL(/\/login/);
});

test('cerrar sesión invalida el acceso a rutas protegidas', async ({ page }) => {
  await login(page, 'ana.analista');
  await page.getByRole('button', { name: /cerrar sesión/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/solicitudes');
  await expect(page).toHaveURL(/\/login/); // el middleware redirige sin cookie
});

test('una ruta protegida sin sesión redirige a login', async ({ page }) => {
  await page.goto('/solicitudes');
  await expect(page).toHaveURL(/\/login/);
});
