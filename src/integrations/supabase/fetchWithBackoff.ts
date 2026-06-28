// Wrapped fetch for the Supabase client:
//  - Retries 429 / 5xx on auth endpoints with exponential backoff, honoring Retry-After.
//  - Deduplicates concurrent refresh_token calls (multiple tabs/components racing).
//
// This sits in front of Supabase's own retry logic and short-circuits the
// "20 refreshes in 2 seconds" storm we saw in the auth logs.

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

const inflightRefresh = new Map<string, Promise<Response>>();

function isAuthUrl(url: string): boolean {
  return url.includes('/auth/v1/');
}

function isRefreshTokenCall(url: string, init?: RequestInit): boolean {
  if (!url.includes('/auth/v1/token')) return false;
  // grant_type=refresh_token may be in query string or body
  if (url.includes('grant_type=refresh_token')) return true;
  const body = init?.body;
  if (typeof body === 'string' && body.includes('refresh_token')) return true;
  return false;
}

function parseRetryAfter(res: Response): number | null {
  const h = res.headers.get('retry-after');
  if (!h) return null;
  const secs = Number(h);
  if (Number.isFinite(secs)) return Math.min(secs * 1000, MAX_DELAY_MS);
  const date = Date.parse(h);
  if (!Number.isNaN(date)) return Math.min(Math.max(0, date - Date.now()), MAX_DELAY_MS);
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function doFetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetch(input, init);
    const retriable = isAuthUrl(url) && (res.status === 429 || (res.status >= 500 && res.status < 600));
    if (!retriable || attempt >= MAX_RETRIES) return res;
    const retryAfter = parseRetryAfter(res);
    const backoff = retryAfter ?? Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
    // Add small jitter to avoid thundering herd between tabs
    const jitter = Math.floor(Math.random() * 250);
    await sleep(backoff + jitter);
    attempt++;
  }
}

export const supabaseFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Deduplicate concurrent refresh_token requests (within this tab)
  if (isRefreshTokenCall(url, init as RequestInit | undefined)) {
    const existing = inflightRefresh.get(url);
    if (existing) {
      // Return a clone so each caller can read the body independently
      return existing.then((r) => r.clone());
    }
    const p = doFetchWithRetry(input, init).finally(() => {
      // Clear shortly after — gives any near-simultaneous callers a chance to reuse
      setTimeout(() => inflightRefresh.delete(url), 500);
    });
    inflightRefresh.set(url, p);
    return p.then((r) => r.clone());
  }

  return doFetchWithRetry(input, init);
};
