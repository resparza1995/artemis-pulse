import {
  Activity,
  AlertOctagon,
  DatabaseZap,
  Server,
} from "lucide-react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { BrokerMetrics, QueueSummary } from "../../types/queues";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { QueueHealthBadge } from "./QueueHealthBadge";
import { StatsCard } from "./StatsCard";

type QueueDashboardProps = {
  pollIntervalMs: number;
  brokerLabel: string;
};

type QueueApiError = {
  message?: string;
};

async function fetchQueues() {
  const response = await fetch("/api/queues", {
    headers: {
      Accept: "application/json",
    },
  });

  let payload: QueueSummary[] | QueueApiError | null = null;

  try {
    payload = (await response.json()) as QueueSummary[] | QueueApiError;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      (payload && !Array.isArray(payload) && payload.message) ||
        "No se pudieron obtener las colas.",
    );
  }

  if (!Array.isArray(payload)) {
    throw new Error("La respuesta del backend no tiene el formato esperado.");
  }

  return payload;
}

async function fetchBrokerMetrics() {
  const response = await fetch("/api/broker/metrics", {
    headers: {
      Accept: "application/json",
    },
  });

  let payload: BrokerMetrics | { error?: string; message?: string } | null = null;

  try {
    payload = (await response.json()) as BrokerMetrics | { error?: string; message?: string };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof (payload as { message?: string }).message === "string"
        ? (payload as { message?: string }).message
        : "No se pudieron obtener las metricas del broker.";

    throw new Error(message);
  }

  if (!payload || typeof (payload as BrokerMetrics).cpuUsage !== "number") {
    throw new Error("La respuesta del backend no tiene el formato esperado para metricas del broker.");
  }

  return payload as BrokerMetrics;
}

function QueueDashboardContent({
  pollIntervalMs,
  brokerLabel,
}: QueueDashboardProps) {
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const queuesQuery = useQuery({
    queryKey: ["queues"],
    queryFn: fetchQueues,
    refetchInterval: pollIntervalMs,
    refetchIntervalInBackground: true,
    retry: 1,
  });

  const brokerMetricsQuery = useQuery({
    queryKey: ["brokerMetrics"],
    queryFn: fetchBrokerMetrics,
    refetchInterval: pollIntervalMs,
    refetchIntervalInBackground: true,
    retry: 1,
  });

  const queues = queuesQuery.data ?? [];
  const metrics = brokerMetricsQuery.data;

  const totalQueues = queues.length;
  const totalMessages = queues.reduce((sum, queue) => sum + queue.messageCount, 0);
  const backlogQueues = queues.filter((queue) => queue.messageCount > 0).length;
  const dlqQueues = queues.filter((queue) => queue.isDlq).length;
  const criticalQueues = queues.filter((queue) => queue.status === "critical").length;
  const warningQueues = queues.filter((queue) => queue.status === "warning").length;
  const isConnected = !queuesQuery.isError && !brokerMetricsQuery.isError;

  const queuesToReview = [...queues]
    .filter((queue) => queue.messageCount > 0 || queue.status !== "healthy")
    .sort((left, right) => {
      const statusWeight = { critical: 2, warning: 1, healthy: 0 };
      const leftWeight = statusWeight[left.status];
      const rightWeight = statusWeight[right.status];

      if (leftWeight !== rightWeight) {
        return rightWeight - leftWeight;
      }

      return right.messageCount - left.messageCount;
    })
    .slice(0, 10);

  const lastUpdatedLabel = queuesQuery.dataUpdatedAt
    ? new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(queuesQuery.dataUpdatedAt))
    : "sin datos";

  async function handleManualRefresh() {
    setIsManualRefreshing(true);

    try {
      await Promise.all([queuesQuery.refetch(), brokerMetricsQuery.refetch()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }

  return (
    <div className="app-scroll-y mx-auto flex h-full w-full max-w-[1600px] min-h-0 flex-col gap-4 pr-1">
      <Card className="flex-none overflow-hidden">
        <CardHeader className="gap-2 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="neutral">broker {brokerLabel}</Badge>
              <Badge variant="neutral">poll {pollIntervalMs} ms</Badge>
              <Badge variant={isConnected ? "success" : "critical"}>
                {isConnected ? "Conectado" : "Sin conexion"}
              </Badge>
              <span className="text-xs text-muted-foreground">Ultima actualizacion: {lastUpdatedLabel}</span>
            </div>

            <Button
              variant="secondary"
              className="min-w-28"
              onClick={() => {
                void handleManualRefresh();
              }}
              disabled={isManualRefreshing}
            >
              {isManualRefreshing ? "Actualizando" : "Refrescar"}
            </Button>
          </div>

          {queuesQuery.isError ? (
            <span className="text-xs text-[var(--critical)]">{queuesQuery.error.message}</span>
          ) : null}
          {!queuesQuery.isError && brokerMetricsQuery.isError ? (
            <span className="text-xs text-[var(--critical)]">{brokerMetricsQuery.error.message}</span>
          ) : null}
        </CardHeader>
      </Card>

      <section className="grid flex-none gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="CPU"
          value={metrics ? `${metrics.cpuUsage}%` : (brokerMetricsQuery.isLoading ? "cargando..." : "-")}
          hint="uso aproximado de CPU"
          icon={Server}
        />
        <StatsCard
          label="Memoria"
          value={metrics ? `${metrics.memoryUsage}%` : (brokerMetricsQuery.isLoading ? "cargando..." : "-")}
          hint="uso de heap JVM"
          icon={DatabaseZap}
        />
        <StatsCard
          label="Mensajes totales"
          value={metrics ? String(metrics.totalMessages) : String(totalMessages)}
          hint="todos los mensajes en colas"
          icon={Activity}
        />
        <StatsCard
          label="Colas"
          value={metrics ? String(metrics.queueCount) : String(totalQueues)}
          hint="numero de colas"
          icon={AlertOctagon}
        />
      </section>

      <section className="grid flex-none gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Backlog"
          value={String(backlogQueues)}
          hint="colas con mensajes pendientes"
          icon={DatabaseZap}
        />
        <StatsCard
          label="DLQ"
          value={String(dlqQueues)}
          hint="colas detectadas como dead letter"
          icon={Activity}
        />
        <StatsCard
          label="Criticas"
          value={String(criticalQueues)}
          hint="backlog alto o sin consumidores"
          icon={AlertOctagon}
        />
        <StatsCard
          label="Warnings"
          value={String(warningQueues)}
          hint="colas con crecimiento o tension"
          icon={AlertOctagon}
        />
      </section>

      <section className="min-h-0 flex-1">
        <Card className="flex h-full min-h-0 w-full flex-col overflow-hidden">
          <CardHeader className="gap-2 border-b border-[color:var(--border)] pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Colas a revisar</CardTitle>
                <CardDescription>
                  Colas con backlog o estado no saludable.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={criticalQueues > 0 ? "critical" : "neutral"}>{criticalQueues} criticas</Badge>
                <Badge variant={dlqQueues > 0 ? "warning" : "neutral"}>{dlqQueues} DLQ</Badge>
                <Badge variant="neutral">{queuesToReview.length} visibles</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden pt-5">
            {queuesToReview.length === 0 ? (
              <div className="app-empty-state flex min-h-0 h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                No hay colas con backlog ni alertas activas en este momento.
              </div>
            ) : (
              <div className="app-scroll-y grid h-full min-h-0 gap-3 pr-1 md:grid-cols-2 xl:grid-cols-3">
                {queuesToReview.map((queue) => (
                  <div
                    key={queue.name}
                    className="app-panel-soft flex min-h-36 flex-col justify-between gap-4 p-4"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-foreground">{queue.name}</p>
                            {queue.isDlq ? <Badge variant="warning">DLQ</Badge> : null}
                          </div>
                          <p className="truncate text-sm text-muted-foreground">{queue.address}</p>
                        </div>
                        <QueueHealthBadge status={queue.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Mensajes</p>
                          <p className="font-medium text-foreground">{queue.messageCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Consumidores</p>
                          <p className="font-medium text-foreground">{queue.consumerCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <a
                        href="/explorer"
                        className="text-xs font-medium text-muted-foreground transition hover:text-primary"
                      >
                        Abrir en Explorer
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function QueueDashboard(props: QueueDashboardProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <QueueDashboardContent {...props} />
    </QueryClientProvider>
  );
}
