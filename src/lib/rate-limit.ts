import "server-only";
import { memoryRateLimitStore, type RateLimitStore } from "./rate-limit/memory";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

let store: RateLimitStore | undefined;

async function activeStore(): Promise<RateLimitStore> {
  if (!store) {
    if (process.env.RATE_LIMIT_STORE === "postgres") {
      const { postgresRateLimitStore } = await import("./rate-limit/postgres");
      store = postgresRateLimitStore;
    } else {
      store = memoryRateLimitStore;
    }
  }

  return store;
}

export async function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const bucket = await (await activeStore()).increment(key, windowMs);

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.resetAt - Date.now()) / 1000),
      ),
    };
  }

  return { allowed: true };
}

export function userRateLimitKey(userId: string, scope: string): string {
  return `${scope}:${userId}`;
}

export async function resetRateLimits() {
  await (await activeStore()).reset();
}
