import { Badge } from "../../ui/badge";
import { useI18n } from "../../i18n/react";

export function TopologyLegend() {
  const { messages } = useI18n();

  return (
    <section className="app-panel-soft flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {messages.topology.legend}
      </span>
      <Badge variant="success">{messages.common.healthy}</Badge>
      <Badge variant="warning">{messages.common.warning}</Badge>
      <Badge variant="critical">{messages.common.critical}</Badge>
      <Badge variant="neutral">{messages.common.inactive}</Badge>
      <span className="ml-1 rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
        DLQ
      </span>
    </section>
  );
}
