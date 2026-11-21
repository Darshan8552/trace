import "server-only";
import { prisma } from "@/lib/prisma";
import type { RateLimitStore } from "./memory";

type BucketRow = {
  count: number;
  resetAt: Date;
};

const PRUNE_CHANCE = 0.01;

export const postgresRateLimitStore: RateLimitStore = {
  async increment(key, windowMs) {
    const [row] = await prisma.$queryRaw<BucketRow[]>`
      INSERT INTO "rate_limit_bucket" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + (${windowMs}::int * interval '1 millisecond'))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit_bucket"."resetAt" <= now() THEN 1
          ELSE "rate_limit_bucket"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "rate_limit_bucket"."resetAt" <= now()
            THEN EXCLUDED."resetAt"
          ELSE "rate_limit_bucket"."resetAt"
        END
      RETURNING "count", "resetAt"
    `;

    if (Math.random() < PRUNE_CHANCE) {
      await prisma.$executeRaw`
          DELETE FROM "rate_limit_bucket"
          WHERE "resetAt" < now() - interval '1 hour'
        `.catch(() => undefined);
    }

    return {
      count: Number(row?.count ?? 1),
      resetAt: (row?.resetAt ?? new Date()).getTime(),
    };
  },

  async reset() {
    await prisma.$executeRaw`DELETE FROM "rate_limit_bucket"`;
  },
};
