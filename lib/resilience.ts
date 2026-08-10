import { db } from "./db";

export async function retry<T>(operation: () => Promise<T>, options: { attempts?: number; baseDelayMs?: number; timeoutMs?: number } = {}) {
  const attempts = options.attempts ?? 3; let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try { return await Promise.race([operation(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Operation timed out.")), options.timeoutMs ?? 25_000))]); }
    catch (error) { lastError = error; if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, (options.baseDelayMs ?? 250) * 2 ** attempt + Math.random() * 100)); }
  }
  throw lastError;
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now(); const row = db().prepare("SELECT count,window_start FROM rate_limits WHERE key=?").get(key) as { count: number; window_start: number } | undefined;
  if (!row || now - row.window_start >= windowMs) { db().prepare("INSERT INTO rate_limits(key,count,window_start) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,window_start=excluded.window_start").run(key, now); return; }
  if (row.count >= limit) throw new RateLimitError();
  db().prepare("UPDATE rate_limits SET count=count+1 WHERE key=?").run(key);
}
export class RateLimitError extends Error { constructor() { super("Rate limit exceeded. Try again later."); } }
