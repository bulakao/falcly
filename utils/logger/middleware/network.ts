import { logger } from '../index';

const SKIP_URL_PATTERNS = [
  /posthog/i,
  /supabase.*\/auth\/v1\/token/i,
  /supabase.*\/realtime/i,
];

let requestCounter = 0;

export function installNetworkLogger(): void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Skip noisy URLs
    if (SKIP_URL_PATTERNS.some((p) => p.test(url))) {
      return originalFetch(input, init);
    }

    const requestId = ++requestCounter;
    const method = init?.method ?? 'GET';

    // Redact query params, keep host + path
    let safeUrl: string;
    try {
      const parsed = new URL(url);
      safeUrl = `${parsed.host}${parsed.pathname}`;
    } catch {
      safeUrl = '[invalid-url]';
    }

    const start = performance.now();

    logger.debug('Network', `${method} ${safeUrl}`, { requestId, method, url: safeUrl });

    try {
      const response = await originalFetch(input, init);
      const durationMs = Math.round(performance.now() - start);

      logger.debug('Network', `${method} ${safeUrl} → ${response.status}`, {
        requestId,
        status: response.status,
        durationMs,
      });

      return response;
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);

      logger.error('Network', `${method} ${safeUrl} failed`, error instanceof Error ? error : undefined, {
        requestId,
        durationMs,
      });

      throw error;
    }
  };
}
