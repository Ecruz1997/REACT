import { NextResponse, type NextRequest } from 'next/server';

// El middleware hace DOS cosas, ninguna es control de acceso:
//  1. Genera el nonce de CSP (Tema 3 / endurecimiento).
//  2. Redirige a /login si no hay cookie — SOLO experiencia de usuario.
// La verificación real de identidad vive en verificarSesion() (el DAL guard),
// pegada a cada acceso a datos. El middleware ha sido evadible por CVEs del framework
// (p. ej. CVE-2025-29927), así que no puede ser el único control.
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  // Redirección de conveniencia (no de seguridad) en rutas protegidas.
  const protegidas = ['/solicitudes', '/auditoria'];
  const esProtegida = protegidas.some((p) => request.nextUrl.pathname.startsWith(p));
  const tieneCookie = request.cookies.has('boveda_access') || request.cookies.has('boveda_refresh');
  if (esProtegida && !tieneCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    { source: '/((?!api|_next/static|_next/image|favicon.ico).*)' },
  ],
};
