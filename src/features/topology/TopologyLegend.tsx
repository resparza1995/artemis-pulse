import { Badge } from "../../ui/badge";

export function TopologyLegend() {
  return (
    <section className="app-panel-soft flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Leyenda
      </span>
      <Badge variant="success">Healthy</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="critical">Critical</Badge>
      <Badge variant="neutral">Inactive</Badge>
      <span className="ml-1 rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
        DLQ
      </span>
    </section>
  );
}
