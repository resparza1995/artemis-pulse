export type QueueStatus = "healthy" | "warning" | "critical";

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
): QueueStatus {
  if (messageCount > 1000 || (messageCount > 0 && consumerCount === 0)) {
    return "critical";
  }

  if (messageCount > 100) {
    return "warning";
  }

  return "healthy";
}
