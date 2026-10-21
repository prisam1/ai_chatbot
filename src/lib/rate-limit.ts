import { HttpError } from "./http";

type Bucket = { count: number; resetAt: number };

const MAX_KEYS = 50_000;

declare global {
  var rateLimitStore: Map<string, Bucket> | undefined;
}

// In-memory fixed window, per server instance
const store = (global.rateLimitStore ??= new Map<string, Bucket>());

function sweep(now: number) {
  for (const [key, bucket] of store) if (bucket.resetAt <= now) store.delete(key);
  // Still full means a flood of unique keys; drop the oldest
  for (const key of store.keys()) {
    if (store.size < MAX_KEYS) break;
    store.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (store.size >= MAX_KEYS) sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count++;
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

export function enforceRateLimit(key: string, limit: number, windowMs: number, message = "Too many requests. Please try again later.") {
  const { ok, retryAfter } = rateLimit(key, limit, windowMs);
  if (!ok) throw new HttpError(429, message, { "Retry-After": String(retryAfter) });
}
