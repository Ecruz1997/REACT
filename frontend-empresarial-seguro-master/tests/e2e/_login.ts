import { type Page, expect } from '@playwright/test';

export async function login(page: Page, usuario: string, contrasena = 'Demo1234') {
  await page.goto('/login');
  await page.getByLabel('Usuario').fill(usuario);
  await page.getByLabel('Contraseña').fill(contrasena);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).toHaveURL(/\/solicitudes/);
}
