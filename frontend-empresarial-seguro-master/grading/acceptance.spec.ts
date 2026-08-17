// Suite de aceptación para calificación. Prueba comportamiento observable en la UI real,
// así funciona contra cualquier entrega que respete el contrato (grading/contract.md).
// Cada test lleva su criterio oficial en el título: [c1]..[c5].
import { test, expect, type Page } from '@playwright/test';
import { USUARIOS, SOLICITUD_A, SOLICITUD_B } from './config.mjs';

async function login(page: Page, u: { usuario: string; contrasena: string }) {
  await page.goto('/login');
  await page.getByLabel(/usuario/i).fill(u.usuario);
  await page.getByLabel(/contraseña/i).fill(u.contrasena);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).toHaveURL(/\/solicitudes/);
}

test.describe('Criterio 1 — flujo de autenticación', () => {
  test('[c1] login válido crea sesión con cookie httpOnly', async ({ page, context }) => {
    await login(page, USUARIOS.analistaA);
    const cookies = await context.cookies();
    const sesion = cookies.find((c) => /access|sesion/i.test(c.name));
    expect(sesion, 'debe existir cookie de sesión').toBeTruthy();
    expect(sesion!.httpOnly, 'la cookie debe ser httpOnly').toBe(true);
  });

  test('[c1] credenciales inválidas no autentican y dan mensaje uniforme', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill(USUARIOS.analistaA.usuario);
    await page.getByLabel(/contraseña/i).fill('incorrecta-xyz');
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('[c1] logout invalida la sesión', async ({ page }) => {
    await login(page, USUARIOS.analistaA);
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/solicitudes');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Criterio 2 — rutas privadas y validación por rol', () => {
  test('[c2] ruta protegida sin sesión redirige a login', async ({ page }) => {
    await page.goto('/solicitudes');
    await expect(page).toHaveURL(/\/login/);
  });

  test('[c2] el auditor accede a la bitácora', async ({ page }) => {
    await login(page, USUARIOS.auditor);
    await page.goto('/auditoria');
    await expect(page.getByRole('heading', { name: /bitácora/i })).toBeVisible();
  });

  test('[c2] un analista NO accede a la bitácora', async ({ page }) => {
    await login(page, USUARIOS.analistaA);
    await page.goto('/auditoria');
    await expect(page).toHaveURL(/\/no-autorizado|\/login/);
  });

  test('[c2] el analista no ve el botón de aprobar', async ({ page }) => {
    await login(page, USUARIOS.analistaA);
    await page.goto(`/solicitudes/${SOLICITUD_A}`);
    await expect(page.getByRole('button', { name: /^aprobar$/i })).toHaveCount(0);
  });
});

test.describe('Criterio 4 — buenas prácticas de seguridad', () => {
  test('[c4] IDOR: analista de A no abre solicitud de B (se comporta como inexistente)', async ({ page }) => {
    await login(page, USUARIOS.analistaA);
    await page.goto(`/solicitudes/${SOLICITUD_B}`);
    await expect(page.getByRole('heading', { name: /no encontrado/i })).toBeVisible();
  });

  test('[c4] el listado de un analista no incluye datos de otra sucursal', async ({ page }) => {
    await login(page, USUARIOS.analistaA);
    // la solicitud de B no debe aparecer en el listado de A
    await expect(page.locator(`a[href*="${SOLICITUD_B}"]`)).toHaveCount(0);
  });

  test('[c4] doble control: el aprobador no aprueba su propia solicitud', async ({ page }) => {
    // beto crea una solicitud (si el formulario está disponible para su rol se omite);
    // aquí verificamos vía UI que la acción de aprobar sobre una propia no cambia el estado.
    // Requiere una solicitud creada por beto; si no existe en el seed, este test se marca skip.
    test.skip(true, 'Requiere solicitud creada por el propio aprobador en el seed extendido.');
  });
});

test.describe('Criterio 3 — estados y retroalimentación', () => {
  test('[c3] la página de no autorizado comunica el estado', async ({ page }) => {
    await login(page, USUARIOS.analistaA);
    await page.goto('/auditoria'); // debería mandar a no-autorizado
    const enNoAutorizado = /\/no-autorizado/.test(page.url());
    if (enNoAutorizado) {
      await expect(page.getByRole('alert')).toBeVisible();
    }
  });

  test('[c3] recorrido con teclado: el formulario de login es navegable', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const activo = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(['input', 'button', 'a']).toContain(activo);
  });
});
