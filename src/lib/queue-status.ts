export type QueueStatus = "healthy" | "warning" | "critical";

export type QueueStatusThresholds = {
  warningBacklog: number;
  criticalBacklog: number;
};

const DEFAULT_WARNING_BACKLOG = 100;
const DEFAULT_CRITICAL_BACKLOG = 1000;

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function getQueueStatusThresholds(): QueueStatusThresholds {
  return {
    warningBacklog: parsePositiveInteger(
      import.meta.env.TOPOLOGY_WARNING_BACKLOG,
      DEFAULT_WARNING_BACKLOG,
    ),
    criticalBacklog: parsePositiveInteger(
      import.meta.env.TOPOLOGY_CRITICAL_BACKLOG,
      DEFAULT_CRITICAL_BACKLOG,
    ),
  };
}

export function isDlqQueue(queueName: string) {
  const normalizedName = queueName.trim().toLowerCase();

  return (
    normalizedName === "dlq" ||
    normalizedName.endsWith(".dlq") ||
    normalizedName.endsWith("-dlq") ||
    normalizedName.endsWith("_dlq") ||
    normalizedName.includes(".dlq.") ||
    normalizedName.includes("-dlq-")
  );
}

export function getQueueStatus(
  messageCount: number,
  consumerCount: number,
  thresholds: QueueStatusThresholds = getQueueStatusThresholds(),
): QueueStatus {
  if (
    messageCount >= thresholds.criticalBacklog ||
    (messageCount > 0 && consumerCount <= 0)
  ) {
    return "critical";
  }

  if (messageCount >= thresholds.warningBacklog) {
    return "warning";
  }

  return "healthy";
}
