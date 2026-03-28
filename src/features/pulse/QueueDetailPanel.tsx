import {
  Activity,
  AlertTriangle,
  Clock3,
  Inbox,
  Server,
  Users,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { QueueSummary } from "../../types/queues";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { QueueHealthBadge } from "./QueueHealthBadge";

type QueueDetailPanelProps = {
  queue?: QueueSummary;
  brokerLabel: string;
  totalQueues: number;
  backlogQueues: number;
  criticalQueues: number;
  withCard?: boolean;
  showHeader?: boolean;
  className?: string;
};

const numberFormatter = new Intl.NumberFormat("es-ES");
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getBacklogPressure(messageCount: number) {
  return clamp((messageCount / 1000) * 100);
}

function getDeliveryActivity(deliveringCount: number, messageCount: number) {
  if (messageCount <= 0) {
    return deliveringCount > 0 ? 100 : 0;
  }

  return clamp((deliveringCount / Math.max(messageCount, 1)) * 100);
}

function getScheduledLoad(scheduledCount: number, messageCount: number) {
  if (messageCount <= 0) {
    return scheduledCount > 0 ? 100 : 0;
  }

  return clamp((scheduledCount / Math.max(messageCount, 1)) * 100);
}

function getOperationalNote(queue: QueueSummary) {
  if (queue.messageCount > 0 && queue.consumerCount === 0) {
    return "Hay mensajes pendientes sin consumidores activos. Es la senal mas urgente para esta cola.";
  }

  if (queue.messageCount > 1000) {
    return "El backlog esta por encima del umbral critico. Conviene revisar capacidad o drenaje del flujo.";
  }

  if (queue.messageCount > 100) {
    return "La cola esta creciendo y merece seguimiento, aunque todavia mantiene operatividad normal.";
  }

  if (queue.isDlq) {
    return "Es una DLQ detectada por nombre. Aunque este estable, conviene vigilarla como zona de excepciones.";
  }

  return "No se observan senales inmediatas de riesgo. La cola se encuentra dentro de parametros saludables.";
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Inbox;
}) {
  return (
    <div className="app-panel-soft p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-primary/80" />
      </div>
      <p className="font-display text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Meter({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{Math.round(value)}%</span>
      </div>
      <div className="app-meter-track">
        <div
          className="app-meter-fill"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function QueueDetailBody({
  queue,
  brokerLabel,
  totalQueues,
  backlogQueues,
  criticalQueues,
}: Omit<QueueDetailPanelProps, "withCard" | "showHeader" | "className">) {
  return (
    <div className="space-y-4">
      {queue ? (
        <>
          <section className="app-panel-soft space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Selected queue
                </p>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {queue.name}
                </h3>
                <p className="text-sm text-muted-foreground">{queue.address}</p>
              </div>
              <QueueHealthBadge status={queue.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {queue.isDlq ? <Badge variant="outline">DLQ</Badge> : <Badge variant="neutral">queue</Badge>}
              <Badge variant="neutral">updated {dateFormatter.format(new Date(queue.lastUpdatedAt))}</Badge>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2.5">
            <MetricTile
              label="Messages"
              value={numberFormatter.format(queue.messageCount)}
              icon={Inbox}
            />
            <MetricTile
              label="Consumers"
              value={numberFormatter.format(queue.consumerCount)}
              icon={Users}
            />
            <MetricTile
              label="Delivering"
              value={numberFormatter.format(queue.deliveringCount)}
              icon={Activity}
            />
            <MetricTile
              label="Scheduled"
              value={numberFormatter.format(queue.scheduledCount)}
              icon={Clock3}
            />
          </section>

          <section className="app-panel-soft space-y-4 p-4">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Operational read
              </p>
              <p className="text-sm leading-6 text-foreground/90">{getOperationalNote(queue)}</p>
            </div>

            <div className="space-y-3">
              <Meter label="Backlog pressure" value={getBacklogPressure(queue.messageCount)} />
              <Meter
                label="Delivery activity"
                value={getDeliveryActivity(queue.deliveringCount, queue.messageCount)}
              />
              <Meter
                label="Scheduled load"
                value={getScheduledLoad(queue.scheduledCount, queue.messageCount)}
              />
            </div>
          </section>
        </>
      ) : (
        <section className="app-empty-state space-y-2 p-4">
          <p className="font-medium text-foreground">Sin cola seleccionada</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Elige una fila en la vista principal para ver su lectura operativa y sus contadores.
          </p>
        </section>
      )}

      <section className="app-panel-soft space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary/80" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Broker snapshot
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Broker</span>
            <span className="text-foreground">{brokerLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Queues visible</span>
            <span className="text-foreground">{numberFormatter.format(totalQueues)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">With backlog</span>
            <span className="text-foreground">{numberFormatter.format(backlogQueues)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Critical queues</span>
            <span className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--warning)]" />
              {numberFormatter.format(criticalQueues)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function QueueDetailPanel({
  queue,
  brokerLabel,
  totalQueues,
  backlogQueues,
  criticalQueues,
  withCard = true,
  showHeader = true,
  className,
}: QueueDetailPanelProps) {
  const body = (
    <QueueDetailBody
      queue={queue}
      brokerLabel={brokerLabel}
      totalQueues={totalQueues}
      backlogQueues={backlogQueues}
      criticalQueues={criticalQueues}
    />
  );

  if (!withCard) {
    return <div className={cn("space-y-4", className)}>{body}</div>;
  }

  return (
    <Card className={className}>
      {showHeader ? (
        <CardHeader className="gap-3 border-b border-[color:var(--border)] pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Queue detail</CardTitle>
              <CardDescription>
                Lectura contextual de la cola seleccionada.
              </CardDescription>
            </div>
            <Badge variant="neutral">live</Badge>
          </div>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4 pt-5">{body}</CardContent>
    </Card>
  );
}
