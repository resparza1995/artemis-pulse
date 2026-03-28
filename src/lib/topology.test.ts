/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import { buildTopologyGraph, getQueueTopologyStatus } from "./topology";
import type { QueueSummary } from "../types/queues";

const baseQueue: QueueSummary = {
  name: "q.base",
  address: "a.base",
  messageCount: 0,
  consumerCount: 0,
  deliveringCount: 0,
  scheduledCount: 0,
  isDlq: false,
  status: "healthy",
  lastUpdatedAt: "2026-03-28T00:00:00.000Z",
};

describe("getQueueTopologyStatus", () => {
  const thresholds = {
    warningBacklog: 100,
    criticalBacklog: 1000,
  };

  test("returns inactive when queue has no consumers and no backlog", () => {
    expect(getQueueTopologyStatus({ consumerCount: 0, messageCount: 0 }, thresholds)).toBe("inactive");
  });

  test("returns warning when queue has backlog without consumers", () => {
    expect(getQueueTopologyStatus({ consumerCount: 0, messageCount: 10 }, thresholds)).toBe("warning");
  });

  test("returns critical when backlog crosses critical threshold", () => {
    expect(getQueueTopologyStatus({ consumerCount: 5, messageCount: 2000 }, thresholds)).toBe("critical");
  });
});

describe("buildTopologyGraph", () => {
  test("builds broker, address and queue relationships", () => {
    const graph = buildTopologyGraph({
      nowIso: "2026-03-28T00:00:00.000Z",
      thresholds: {
        warningBacklog: 100,
        criticalBacklog: 1000,
      },
      queues: [
        {
          ...baseQueue,
          name: "q.orders",
          address: "orders.events",
          consumerCount: 2,
          messageCount: 20,
        },
        {
          ...baseQueue,
          name: "q.orders.dlq",
          address: "orders.events",
          isDlq: true,
          consumerCount: 0,
          messageCount: 8,
        },
      ],
    });

    const brokerNode = graph.nodes.find((node) => node.type === "broker");
    expect(brokerNode).toBeDefined();

    const addressNode = graph.nodes.find((node) => node.type === "address" && node.label === "orders.events");
    expect(addressNode).toBeDefined();

    const queueNode = graph.nodes.find((node) => node.type === "queue" && node.label === "q.orders");
    expect(queueNode).toBeDefined();
    expect(queueNode?.meta?.consumerCount).toBe(2);

    const dlqNode = graph.nodes.find((node) => node.type === "queue" && node.label === "q.orders.dlq");
    expect(dlqNode?.meta?.isDlq).toBe(true);

    const hasQueueEdge = graph.edges.some(
      (edge) => edge.source === addressNode?.id && edge.target === queueNode?.id,
    );
    expect(hasQueueEdge).toBe(true);
  });
});
