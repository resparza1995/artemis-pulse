/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { getQueueStatus } from "./queue-status";

describe("getQueueStatus", () => {
  const thresholds = {
    warningBacklog: 100,
    criticalBacklog: 1000,
  };

  test("returns healthy when queue has no backlog and no consumers", () => {
    expect(getQueueStatus(0, 0, thresholds)).toBe("healthy");
  });

  test("returns critical when queue has messages but no consumers", () => {
    expect(getQueueStatus(10, 0, thresholds)).toBe("critical");
  });

  test("returns warning when backlog crosses warning threshold", () => {
    expect(getQueueStatus(150, 3, thresholds)).toBe("warning");
  });

  test("returns critical when backlog crosses critical threshold", () => {
    expect(getQueueStatus(1200, 3, thresholds)).toBe("critical");
  });
});
