import { ArrowRight, ExternalLink } from "lucide-react";
import type { TopologyNode } from "./types";

type TopologyDetailPanelProps = {
  selectedNode: TopologyNode | null;
  relatedIncoming: TopologyNode[];
  relatedOutgoing: TopologyNode[];
};

function renderStatusLabel(status: TopologyNode["status"]) {
  if (status === "healthy") {
    return "Healthy";
  }
  if (status === "warning") {
    return "Warning";
  }
  if (status === "critical") {
    return "Critical";
  }
  return "Inactive";
}

export function TopologyDetailPanel({
  selectedNode,
  relatedIncoming,
  relatedOutgoing,
}: TopologyDetailPanelProps) {
  if (!selectedNode) {
    return (
      <aside className="app-panel min-h-0 w-full max-w-[360px] overflow-hidden p-4">
        <div className="app-empty-state flex h-full min-h-[240px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Selecciona un nodo para ver tipo, estado y relaciones inmediatas.
        </div>
      </aside>
    );
  }

  const explorerHref =
    selectedNode.type === "queue"
      ? `/explorer?queue=${encodeURIComponent(selectedNode.meta?.queueName ?? selectedNode.label)}`
      : null;

  return (
    <aside className="app-panel min-h-0 w-full max-w-[360px] p-4">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <header className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Detalle
          </p>
          <h2 className="text-lg font-semibold text-foreground">{selectedNode.label}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-[var(--border)] px-2 py-1 uppercase tracking-[0.14em]">
              {selectedNode.type}
            </span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1 uppercase tracking-[0.14em]">
              {renderStatusLabel(selectedNode.status)}
            </span>
          </div>
        </header>

        <section className="app-panel-inset space-y-2 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Metadatos
          </p>
          <p className="text-muted-foreground">id: {selectedNode.id}</p>
          {selectedNode.meta?.routingType ? (
            <p className="text-muted-foreground">routing: {selectedNode.meta.routingType}</p>
          ) : null}
          {typeof selectedNode.meta?.backlog === "number" ? (
            <p className="text-muted-foreground">backlog: {selectedNode.meta.backlog}</p>
          ) : null}
          {typeof selectedNode.meta?.consumerCount === "number" ? (
            <p className="text-muted-foreground">consumers: {selectedNode.meta.consumerCount}</p>
          ) : null}
          {selectedNode.meta?.isDlq ? <p className="text-warning">DLQ habilitada</p> : null}
        </section>

        <section className="app-panel-inset min-h-0 flex-1 space-y-3 overflow-hidden p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Relaciones inmediatas
          </p>

          <div className="space-y-1 overflow-y-auto">
            {relatedIncoming.length > 0 ? (
              relatedIncoming.map((node) => (
                <p key={`in-${node.id}`} className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 rotate-180 text-primary" />
                  {node.label}
                </p>
              ))
            ) : (
              <p className="text-muted-foreground/80">Sin relaciones de entrada.</p>
            )}
          </div>

          <div className="space-y-1 overflow-y-auto">
            {relatedOutgoing.length > 0 ? (
              relatedOutgoing.map((node) => (
                <p key={`out-${node.id}`} className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  {node.label}
                </p>
              ))
            ) : (
              <p className="text-muted-foreground/80">Sin relaciones de salida.</p>
            )}
          </div>
        </section>

        {explorerHref ? (
          <a
            href={explorerHref}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary-hover)]"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir en Explorer
          </a>
        ) : null}
      </div>
    </aside>
  );
}
