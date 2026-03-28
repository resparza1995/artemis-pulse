import { useMemo } from "react";
import ReactFlow, { Background, Controls, Position, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import type { TopologyEdge, TopologyNode } from "../../types/topology";

type TopologyCanvasProps = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  viewport: { x: number; y: number; zoom: number } | null;
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void;
};

type FlowNodeData = {
  label: string;
  type: TopologyNode["type"];
  status: TopologyNode["status"];
  isDlq: boolean;
};

const statusToken: Record<TopologyNode["status"], { bg: string; border: string; text: string }> = {
  healthy: {
    bg: "var(--success-soft)",
    border: "var(--success-border)",
    text: "var(--success-foreground)",
  },
  warning: {
    bg: "var(--warning-soft)",
    border: "var(--warning-border)",
    text: "var(--warning-foreground)",
  },
  critical: {
    bg: "var(--critical-soft)",
    border: "var(--critical-border)",
    text: "var(--critical-foreground)",
  },
  inactive: {
    bg: "rgba(255,255,255,0.05)",
    border: "var(--border)",
    text: "var(--muted-foreground)",
  },
};

function nodePrefix(type: TopologyNode["type"]) {
  if (type === "broker") {
    return "BRK";
  }
  if (type === "address") {
    return "ADR";
  }
  if (type === "queue") {
    return "QUE";
  }
  return "CON";
}

export function TopologyCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  viewport,
  onViewportChange,
}: TopologyCanvasProps) {
  const flowNodes = useMemo<Node<FlowNodeData>[]>(
    () =>
      nodes.map((node) => {
        const status = statusToken[node.status];
        const isSelected = selectedNodeId === node.id;
        return {
          id: node.id,
          type: "default",
          position: node.position,
          data: {
            label: node.label,
            type: node.type,
            status: node.status,
            isDlq: Boolean(node.meta?.isDlq),
          },
          style: {
            width: node.type === "broker" ? 180 : 210,
            borderRadius: node.type === "broker" ? 16 : 14,
            border: `1px solid ${isSelected ? "var(--primary)" : status.border}`,
            background: status.bg,
            color: status.text,
            boxShadow: isSelected ? "0 0 0 2px var(--focus-ring)" : "none",
            fontSize: 12,
            fontWeight: 600,
            padding: 10,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };
      }),
    [nodes, selectedNodeId],
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: false,
        style: { stroke: "rgba(255,255,255,0.28)", strokeWidth: 1.25 },
        labelStyle: {
          fontSize: 10,
          fill: "var(--muted-foreground)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        },
      })),
    [edges],
  );

  return (
    <div className="app-panel min-h-0 flex-1 overflow-hidden">
      <ReactFlow
        nodes={flowNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            label: `${nodePrefix(node.data.type)} · ${node.data.label}${node.data.isDlq ? " · DLQ" : ""}`,
          },
        }))}
        edges={flowEdges}
        fitView={viewport === null}
        defaultViewport={viewport ?? { x: 0, y: 0, zoom: 1 }}
        minZoom={0.35}
        maxZoom={1.6}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onMoveEnd={(_, nextViewport) => onViewportChange(nextViewport)}
        className="h-full w-full"
      >
        <Background gap={20} size={1} color="rgba(255,255,255,0.08)" />
        <Controls
          showInteractive={false}
          className="!rounded-xl !border !border-[var(--border)] !bg-[var(--surface-panel-muted)]"
        />
      </ReactFlow>
    </div>
  );
}
