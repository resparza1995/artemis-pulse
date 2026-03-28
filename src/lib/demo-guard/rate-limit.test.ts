/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { checkDemoWriteRateLimit } from "./rate-limit";

describe("demo guard rate limit", () => {
  test("blocks writes after reaching the configured max", () => {
    process.env.DEMO_RATE_LIMIT_WINDOW_MS = "60000";
    process.env.DEMO_RATE_LIMIT_MAX_WRITES = "2";

    const key = `test-ip-${Date.now()}`;
    const first = checkDemoWriteRateLimit(key);
    const second = checkDemoWriteRateLimit(key);
    const third = checkDemoWriteRateLimit(key);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs > 0).toBe(true);
  });
});
