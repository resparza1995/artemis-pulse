import type { QueueStatus } from "../lib/queue-status";

export type QueueSummary = {
  name: string;
  address: string;
  messageCount: number;
  consumerCount: number;
  deliveringCount: number;
  scheduledCount: number;
  isDlq: boolean;
  status: QueueStatus;
  lastUpdatedAt: string;
};

export type BrokerMetrics = {
  cpuUsage: number;
  memoryUsage: number;
  totalMessages: number;
  queueCount: number;
  criticalQueueCount: number;
  lastUpdatedAt: string;
};
