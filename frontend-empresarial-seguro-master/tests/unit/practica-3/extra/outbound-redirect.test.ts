import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validarDestino, fetchSeguro } from '@/lib/outbound';

describe('outbound - redirect & internal handling', () => {
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = (globalThis as any).fetch;
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('bloquea hosts internos (metadata/privadas) en validarDestino', () => {
    const r1 = validarDestino('https://169.254.169.254/latest/meta-data/');
    expect(r1.permitido).toBe(false);
    const r2 = validarDestino('https://10.0.1.5/_health');
    expect(r2.permitido).toBe(false);
    const r3 = validarDestino('https://127.0.0.1/status');
    expect(r3.permitido).toBe(false);
  });

  it('fetchSeguro llama a fetch con `redirect: "error"` para evitar seguir redirects', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as any).fetch = mockFetch;

    const url = 'https://api.core.bancocr.fi.cr/v1/tipo-cambio';

    await fetchSeguro(url, { method: 'GET' } as any);

    expect(mockFetch).toHaveBeenCalled();
    const calledArgs = mockFetch.mock.calls[0];
    expect(calledArgs[1]).toBeDefined();
    expect(calledArgs[1].redirect).toBe('error');
  });
});
