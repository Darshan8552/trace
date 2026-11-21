type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const SWEEP_THRESHOLD = 5_000;

export type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitStore = {
  increment: (key: string, windowMs: number) => Promise<RateLimitBucket>;
  reset: () => Promise<void>;
};

export const memoryRateLimitStore: RateLimitStore = {
  async increment(key, windowMs) {
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (buckets.size > SWEEP_THRESHOLD) {
      sweep(now);
    }

    return { count: bucket.count, resetAt: bucket.resetAt };
  },

  async reset() {
    buckets.clear();
  },
};

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
