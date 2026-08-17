// Chequeos de aceptación a nivel HTTP (sin navegador).
// Prueban lo verificable sin iniciar sesión. Salida JSON en grading/.report/http.json
import { BASE_URL } from './config.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const resultados = [];
function registrar(id, criterio, ok, detalle) {
  resultados.push({ id, criterio, ok, detalle });
  const marca = ok ? 'PASA' : 'FALLA';
  console.log(`[${marca}] (${criterio}) ${id}${detalle ? ' — ' + detalle : ''}`);
}

async function main() {
  // c1: existe el formulario de login
  try {
    const r = await fetch(`${BASE_URL}/login`, { redirect: 'manual' });
    const html = await r.text();
    registrar('login_disponible', 'c1', r.status === 200 && /type=["']password["']/.test(html),
      `HTTP ${r.status}`);
  } catch (e) { registrar('login_disponible', 'c1', false, `sin conexión: ${e.message}`); }

  // c2: ruta protegida sin cookie redirige a /login
  try {
    const r = await fetch(`${BASE_URL}/solicitudes`, { redirect: 'manual' });
    const loc = r.headers.get('location') ?? '';
    registrar('ruta_protegida_redirige', 'c2',
      (r.status === 307 || r.status === 302 || r.status === 308) && /\/login/.test(loc),
      `HTTP ${r.status} → ${loc || '(sin location)'}`);
  } catch (e) { registrar('ruta_protegida_redirige', 'c2', false, e.message); }

  // c2: /auditoria sin cookie también protegida
  try {
    const r = await fetch(`${BASE_URL}/auditoria`, { redirect: 'manual' });
    registrar('auditoria_protegida', 'c2', r.status >= 300 && r.status < 400,
      `HTTP ${r.status}`);
  } catch (e) { registrar('auditoria_protegida', 'c2', false, e.message); }

  // c3: existe la página de estado 403
  try {
    const r = await fetch(`${BASE_URL}/no-autorizado`, { redirect: 'manual' });
    registrar('estado_403_existe', 'c3', r.status === 200, `HTTP ${r.status}`);
  } catch (e) { registrar('estado_403_existe', 'c3', false, e.message); }

  // c4: cabeceras de seguridad presentes
  try {
    const r = await fetch(`${BASE_URL}/login`, { redirect: 'manual' });
    const h = (k) => r.headers.get(k) ?? '';
    const checks = {
      'Content-Security-Policy': /./.test(h('content-security-policy')),
      'Strict-Transport-Security': /max-age/.test(h('strict-transport-security')),
      'X-Content-Type-Options': /nosniff/i.test(h('x-content-type-options')),
      'Referrer-Policy': /./.test(h('referrer-policy')),
    };
    for (const [cab, ok] of Object.entries(checks)) {
      registrar(`cabecera_${cab}`, 'c4', ok, ok ? h(cab).slice(0, 48) : 'ausente');
    }
    // CSP con nonce (no unsafe-inline en script-src)
    const csp = h('content-security-policy');
    registrar('csp_con_nonce', 'c4', /nonce-/.test(csp) && !/script-src[^;]*unsafe-inline/.test(csp),
      /nonce-/.test(csp) ? 'nonce presente' : 'sin nonce');
  } catch (e) { registrar('cabeceras', 'c4', false, e.message); }

  mkdirSync('grading/.report', { recursive: true });
  writeFileSync('grading/.report/http.json', JSON.stringify(resultados, null, 2));
  const fallos = resultados.filter((r) => !r.ok).length;
  console.log(`\nHTTP smoke: ${resultados.length - fallos}/${resultados.length} pasan`);
}
main();
