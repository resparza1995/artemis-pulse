import { getBrokerLabel } from "./config";
import type { QueueSummary } from "../types/queues";
import type { TopologyEdge, TopologyGraph, TopologyNode, TopologyNodeStatus } from "../types/topology";

export type TopologyThresholds = {
  warningBacklog: number;
  criticalBacklog: number;
};

type BuildTopologyInput = {
  queues: QueueSummary[];
  nowIso?: string;
  thresholds?: TopologyThresholds;
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

export function getTopologyThresholds(): TopologyThresholds {
  return {
    warningBacklog: parsePositiveInteger(import.meta.env.TOPOLOGY_WARNING_BACKLOG, DEFAULT_WARNING_BACKLOG),
    criticalBacklog: parsePositiveInteger(import.meta.env.TOPOLOGY_CRITICAL_BACKLOG, DEFAULT_CRITICAL_BACKLOG),
  };
}

export function getQueueTopologyStatus(
  queue: Pick<QueueSummary, "consumerCount" | "messageCount">,
  thresholds: TopologyThresholds,
): TopologyNodeStatus {
  if (queue.consumerCount <= 0 && queue.messageCount <= 0) {
    return "inactive";
  }

  if (queue.messageCount >= thresholds.criticalBacklog) {
    return "critical";
  }

  if (queue.consumerCount <= 0) {
    return "warning";
  }

  if (queue.messageCount >= thresholds.warningBacklog) {
    return "warning";
  }

  return "healthy";
}

function createId(prefix: string, value: string) {
  return `${prefix}-${value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-")}`;
}

function sortByLabel<T extends { label: string }>(items: T[]) {
  return [...items].sort((left, right) => left.label.localeCompare(right.label));
}

export function buildTopologyGraph({ queues, nowIso, thresholds = getTopologyThresholds() }: BuildTopologyInput): TopologyGraph {
  const brokerId = "broker-main";
  const brokerLabel = getBrokerLabel();
  const nodes: TopologyNode[] = [
    {
      id: brokerId,
      type: "broker",
      label: brokerLabel,
      status: "healthy",
      position: { x: 560, y: 40 },
      meta: {
        description: "Broker detectado via configuracion de Artemis/Jolokia.",
      },
    },
  ];
  const edges: TopologyEdge[] = [];
  const lastUpdatedAt = nowIso ?? new Date().toISOString();

  const addressMap = new Map<
    string,
    {
      id: string;
      label: string;
      queues: QueueSummary[];
    }
  >();

  for (const queue of queues) {
    const addressKey = queue.address.trim();
    const existing = addressMap.get(addressKey);
    if (existing) {
      existing.queues.push(queue);
      continue;
    }
    addressMap.set(addressKey, {
      id: createId("address", queue.address),
      label: queue.address,
      queues: [queue],
    });
  }

  const addresses = sortByLabel(
    [...addressMap.values()].map((address) => ({
      ...address,
      status: address.queues.some((queue) => getQueueTopologyStatus(queue, thresholds) === "critical")
        ? ("critical" as const)
        : address.queues.some((queue) => getQueueTopologyStatus(queue, thresholds) === "warning")
          ? ("warning" as const)
          : address.queues.every((queue) => getQueueTopologyStatus(queue, thresholds) === "inactive")
            ? ("inactive" as const)
            : ("healthy" as const),
    })),
  );

  const addressXSpacing = 340;
  const addressBaseX = 140;
  const addressY = 220;
  const queueBaseY = 410;
  const queueRowHeight = 130;
  const queueColumnOffset = 120;
  const consumerYOffset = 90;

  addresses.forEach((address, addressIndex) => {
    const addressX = addressBaseX + addressIndex * addressXSpacing;
    nodes.push({
      id: address.id,
      type: "address",
      label: address.label,
      status: address.status,
      position: { x: addressX, y: addressY },
      meta: {
        parentId: brokerId,
        addressName: address.label,
        description: `Refrescado ${lastUpdatedAt}`,
      },
    });

    edges.push({
      id: `e-${brokerId}-${address.id}`,
      source: brokerId,
      target: address.id,
    });

    const sortedQueues = [...address.queues].sort((left, right) => left.name.localeCompare(right.name));

    sortedQueues.forEach((queue, queueIndex) => {
      const queueId = createId("queue", queue.name);
      const queueX = addressX + (queueIndex % 2 === 0 ? -queueColumnOffset : queueColumnOffset);
      const queueY = queueBaseY + Math.floor(queueIndex / 2) * queueRowHeight;
      const queueStatus = getQueueTopologyStatus(queue, thresholds);

      nodes.push({
        id: queueId,
        type: "queue",
        label: queue.name,
        status: queueStatus,
        position: { x: queueX, y: queueY },
        meta: {
          parentId: address.id,
          queueName: queue.name,
          addressName: queue.address,
          isDlq: queue.isDlq,
          backlog: queue.messageCount,
          consumerCount: queue.consumerCount,
        },
      });

      edges.push({
        id: `e-${address.id}-${queueId}`,
        source: address.id,
        target: queueId,
        label: queue.isDlq ? "DLQ" : undefined,
      });

      const maxRenderableConsumers = Math.min(queue.consumerCount, 3);
      if (maxRenderableConsumers > 0) {
        for (let index = 0; index < maxRenderableConsumers; index += 1) {
          const consumerId = `${queueId}-consumer-${index + 1}`;
          nodes.push({
            id: consumerId,
            type: "consumer",
            label:
              queue.consumerCount > 3 && index === maxRenderableConsumers - 1
                ? `+${queue.consumerCount - 2} consumers`
                : `${queue.name}.consumer.${index + 1}`,
            status: "healthy",
            position: {
              x: queueX + (index - 1) * 70,
              y: queueY + consumerYOffset,
            },
            meta: {
              parentId: queueId,
              queueName: queue.name,
            },
          });
          edges.push({
            id: `e-${queueId}-${consumerId}`,
            source: queueId,
            target: consumerId,
          });
        }
      } else {
        const consumerId = `${queueId}-consumer-inactive`;
        nodes.push({
          id: consumerId,
          type: "consumer",
          label: `${queue.name}.consumer.inactive`,
          status: "inactive",
          position: {
            x: queueX,
            y: queueY + consumerYOffset,
          },
          meta: {
            parentId: queueId,
            queueName: queue.name,
            description: "Queue sin consumers activos",
          },
        });
        edges.push({
          id: `e-${queueId}-${consumerId}`,
          source: queueId,
          target: consumerId,
        });
      }
    });
  });

  return { nodes, edges };
}
