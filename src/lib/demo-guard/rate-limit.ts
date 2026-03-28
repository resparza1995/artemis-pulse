import { getDemoGuardConfig } from "./config";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getNow() {
  return Date.now();
}

export function checkDemoWriteRateLimit(clientKey: string): RateLimitResult {
  const { rateLimitMaxWrites, rateLimitWindowMs } = getDemoGuardConfig();
  const now = getNow();
  const key = clientKey || "unknown";
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(rateLimitMaxWrites - 1, 0),
      retryAfterMs: rateLimitWindowMs,
    };
  }

  if (current.count >= rateLimitMaxWrites) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(current.resetAt - now, 1),
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(rateLimitMaxWrites - current.count, 0),
    retryAfterMs: Math.max(current.resetAt - now, 1),
  };
}
