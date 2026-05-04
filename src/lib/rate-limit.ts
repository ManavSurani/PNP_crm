/**
 * Simple in-memory rate limiter — no external dependencies.
 * Works for this local/desktop SQLite CRM setup.
 *
 * Strategy: sliding window — track attempts within a time window per key.
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const store = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS  = 5;           // Max failures before block
const WINDOW_MS     = 15 * 60 * 1000; // 15-minute sliding window
const BLOCK_MS      = 15 * 60 * 1000; // Block for 15 minutes after limit hit

/** Returns { allowed: true } or { allowed: false, retryAfterMs: number } */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = store.get(key);

  // If currently blocked
  if (record?.blockedUntil) {
    if (now < record.blockedUntil) {
      return { allowed: false, retryAfterMs: record.blockedUntil - now };
    }
    // Block expired — reset
    store.delete(key);
  }

  // First attempt from this key
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  // Within the window
  record.count += 1;

  if (record.count > MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS;
    store.set(key, record);
    return { allowed: false, retryAfterMs: BLOCK_MS };
  }

  store.set(key, record);
  return { allowed: true };
}

/** Call this on successful login to clear the attempt counter */
export function clearRateLimit(key: string): void {
  store.delete(key);
}

/** Cleanup stale entries periodically (called on each check) */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    const expired = record.blockedUntil
      ? now > record.blockedUntil
      : now - record.firstAttempt > WINDOW_MS;
    if (expired) store.delete(key);
  }
}, 5 * 60 * 1000); // Sweep every 5 minutes
