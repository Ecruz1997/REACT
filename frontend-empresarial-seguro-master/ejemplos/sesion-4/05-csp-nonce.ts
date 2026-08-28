// Sesión 4 · Extra — CSP con nonce por request (Endurecimiento).
//
// La política que emite middleware.ts, aislada como función pura para poder PROBARLA:
// el nonce cambia en cada request y script-src no admite 'unsafe-inline'.
// (El grading la verifica por HTTP en grading/http-smoke.mjs: chequeo csp_con_nonce.)
export function construirCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    // 'strict-dynamic': el script CON nonce puede cargar sus dependencias;
    // todo lo demás (inyectado, inline sin nonce) queda bloqueado.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`, // nadie nos mete en un iframe (clickjacking)
    `upgrade-insecure-requests`,
  ].join('; ');
}

export function generarNonce(): string {
  // Único por request. En el middleware real: Buffer.from(crypto.randomUUID()).toString('base64').
  return btoa(crypto.randomUUID());
}
