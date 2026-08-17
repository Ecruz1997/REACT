// Orquesta los chequeos y produce un reporte por criterio oficial de la rúbrica de prácticas.
// Uso: node grading/grade.mjs   (con la app del estudiante corriendo en BASE_URL)
import { CRITERIOS, BASE_URL } from './config.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

function seguro(fn, fallback) { try { return fn(); } catch { return fallback; } }

console.log(`\n=== Calificación de aceptación · Bóveda ===`);
console.log(`Objetivo: ${BASE_URL}\n`);

// 1. HTTP smoke (sin navegador)
console.log('— Chequeos HTTP —');
seguro(() => execSync('node grading/http-smoke.mjs', { stdio: 'inherit' }), null);

// 2. E2E Playwright (si está instalado el navegador)
console.log('\n— Chequeos E2E (Playwright) —');
let e2eCorrio = false;
try {
  execSync('npx playwright test --config grading/playwright.grading.config.ts', { stdio: 'inherit' });
  e2eCorrio = true;
} catch {
  e2eCorrio = existsSync('grading/.report/e2e.json'); // corrió aunque haya fallos
}

// 3. Recolectar resultados
const resultados = [];
if (existsSync('grading/.report/http.json')) {
  resultados.push(...JSON.parse(readFileSync('grading/.report/http.json', 'utf-8')));
}
if (existsSync('grading/.report/e2e.json')) {
  const j = JSON.parse(readFileSync('grading/.report/e2e.json', 'utf-8'));
  const specs = [];
  const walk = (s) => { (s.suites ?? []).forEach(walk); (s.specs ?? []).forEach((sp) => specs.push(sp)); };
  (j.suites ?? []).forEach(walk);
  for (const sp of specs) {
    const m = sp.title.match(/\[(c[1-5])\]/);
    const criterio = m ? m[1] : 'c5';
    const ok = sp.tests?.every((t) => t.results?.every((r) => r.status === 'passed' || r.status === 'skipped'));
    resultados.push({ id: sp.title, criterio, ok: !!ok });
  }
}

// 4. Agrupar por criterio y sugerir banda
console.log('\n=== Reporte por criterio (rúbrica oficial de prácticas) ===\n');
let total = 0, pasados = 0;
for (const [cid, nombre] of Object.entries(CRITERIOS)) {
  const delCrit = resultados.filter((r) => r.criterio === cid);
  if (delCrit.length === 0) { console.log(`${cid.toUpperCase()} · ${nombre}\n     (sin chequeos automáticos — evaluación manual)\n`); continue; }
  const ok = delCrit.filter((r) => r.ok).length;
  total += delCrit.length; pasados += ok;
  const ratio = ok / delCrit.length;
  const banda = ratio === 1 ? 'Satisfactoria (8–10)' : ratio >= 0.6 ? 'Aceptable (5–7)' : 'Insatisfactoria (1–4)';
  console.log(`${cid.toUpperCase()} · ${nombre}`);
  console.log(`     ${ok}/${delCrit.length} chequeos · sugerencia: ${banda}`);
  delCrit.filter((r) => !r.ok).forEach((r) => console.log(`       ✗ ${r.id}`));
  console.log('');
}
console.log(`Global automatizado: ${pasados}/${total} chequeos.`);
console.log(`Nota: C5 (organización y explicación) y la defensa incluyen juicio docente; el harness cubre lo verificable.`);
if (!e2eCorrio) console.log(`\n⚠ Playwright no corrió (¿falta 'npx playwright install chromium'?). El reporte usa solo los chequeos HTTP.`);
