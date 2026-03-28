export type TopologyNodeKind = "broker" | "address" | "queue" | "consumer";

export type TopologyNodeStatus = "healthy" | "warning" | "critical" | "inactive";

export type TopologyNodeMeta = {
  parentId?: string;
  queueName?: string;
  addressName?: string;
  isDlq?: boolean;
  backlog?: number;
  consumerCount?: number;
  routingType?: "ANYCAST" | "MULTICAST";
  description?: string;
};

export type TopologyNode = {
  id: string;
  type: TopologyNodeKind;
  label: string;
  status: TopologyNodeStatus;
  position: {
    x: number;
    y: number;
  };
  meta?: TopologyNodeMeta;
};

export type TopologyEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type TopologyGraph = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
};

export type TopologyResponse = {
  graph: TopologyGraph;
  lastUpdatedAt: string;
};
