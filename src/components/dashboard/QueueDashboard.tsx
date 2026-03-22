import {
  Activity,
  AlertOctagon,
  DatabaseZap,
  RefreshCw,
  Server,
} from "lucide-react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { BrokerMetrics, QueueSummary } from "../../types/queues";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { QueueDetailPanel } from "./QueueDetailPanel";
import { QueueFilters } from "./QueueFilters";
import { QueueTable } from "./QueueTable";
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
        : "No se pudieron obtener las métricas del broker.";

    throw new Error(message);
  }

  if (!payload || typeof (payload as BrokerMetrics).cpuUsage !== "number") {
    throw new Error("La respuesta del backend no tiene el formato esperado para métricas del broker.");
  }

  return payload as BrokerMetrics;
}

function QueueDashboardContent({
  pollIntervalMs,
  brokerLabel,
}: QueueDashboardProps) {
  const [search, setSearch] = useState("");
  const [onlyWithMessages, setOnlyWithMessages] = useState(false);
  const [onlyDlq, setOnlyDlq] = useState(false);
  const [selectedQueueName, setSelectedQueueName] = useState("");
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
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

  const queues = query.data ?? [];
  const metrics = brokerMetricsQuery.data;

  useEffect(() => {
    setSelectedQueueName((current) => {
      if (queues.some((queue) => queue.name === current)) {
        return current;
      }

      return queues[0]?.name ?? "";
    });
  }, [queues]);

  const filteredQueues = queues.filter((queue) => {
    const matchesSearch =
      deferredSearch.trim().length === 0 ||
      queue.name.toLowerCase().includes(deferredSearch.trim().toLowerCase());
    const matchesBacklog = !onlyWithMessages || queue.messageCount > 0;
    const matchesDlq = !onlyDlq || queue.isDlq;

    return matchesSearch && matchesBacklog && matchesDlq;
  });

  const totalQueues = queues.length;
  const totalMessages = queues.reduce((sum, queue) => sum + queue.messageCount, 0);
  const backlogQueues = queues.filter((queue) => queue.messageCount > 0).length;
  const dlqQueues = queues.filter((queue) => queue.isDlq).length;
  const criticalQueues = queues.filter((queue) => queue.status === "critical").length;
  const selectedQueue = queues.find((queue) => queue.name === selectedQueueName);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="outline">Overview</Badge>
            <Badge variant="neutral">broker {brokerLabel}</Badge>
            <Badge variant="neutral">poll {pollIntervalMs} ms</Badge>
            {query.isFetching && !query.isLoading ? (
              <Badge variant="neutral" className="gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                actualizando
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_auto] lg:items-end">
            <div className="space-y-2">
              <CardTitle className="max-w-2xl text-2xl sm:text-3xl">
                Console view para colas, DLQ y backlog en tiempo casi real.
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">
                La vista principal prioriza lectura rapida del broker y un panel
                lateral persistente para entender cada cola sin abrir nuevas pantallas.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 lg:justify-end">
              <Button
                variant="secondary"
                className="min-w-28"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
              >
                {query.isFetching ? "Actualizando" : "Refrescar"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="CPU"
          value={metrics ? `${metrics.cpuUsage}%` : (brokerMetricsQuery.isLoading ? "cargando..." : "—")}
          hint="uso aproximado de CPU"
          icon={Server}
        />
        <StatsCard
          label="Memoria"
          value={metrics ? `${metrics.memoryUsage}%` : (brokerMetricsQuery.isLoading ? "cargando..." : "—")}
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
          hint="número de colas"
          icon={AlertOctagon}
        />
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
          label="Criticas detectadas"
          value={metrics ? String(metrics.criticalQueueCount) : String(criticalQueues)}
          hint="colas en estado crítico"
          icon={AlertOctagon}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <QueueFilters
            search={search}
            onlyWithMessages={onlyWithMessages}
            onlyDlq={onlyDlq}
            onSearchChange={(value) => {
              startTransition(() => {
                setSearch(value);
              });
            }}
            onOnlyWithMessagesChange={(value) => {
              startTransition(() => {
                setOnlyWithMessages(value);
              });
            }}
            onOnlyDlqChange={(value) => {
              startTransition(() => {
                setOnlyDlq(value);
              });
            }}
          />

          {query.isLoading ? (
            <Card>
              <CardContent className="flex min-h-72 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Cargando resumen de colas...
                </div>
              </CardContent>
            </Card>
          ) : (
            <QueueTable
              queues={filteredQueues}
              selectedQueueName={selectedQueueName}
              onSelectQueue={(queue) => setSelectedQueueName(queue.name)}
            />
          )}
        </div>

        <div className="space-y-4">
          <QueueDetailPanel
            queue={selectedQueue}
            brokerLabel={brokerLabel}
            totalQueues={totalQueues}
            backlogQueues={backlogQueues}
            criticalQueues={criticalQueues}
          />

          <Card>
            <CardHeader>
              <CardTitle>Estado del backend</CardTitle>
              <CardDescription>
                La UI sigue operativa incluso si el broker deja de responder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {query.isError ? (
                <div className="app-notice app-notice-critical space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertOctagon className="mt-0.5 h-5 w-5" />
                    <div className="space-y-1">
                      <p className="font-medium">Conexion no disponible</p>
                      <p className="text-sm opacity-90">{query.error.message}</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => query.refetch()}>
                    Reintentar consulta
                  </Button>
                </div>
              ) : (
                <div className="app-notice app-notice-success space-y-2">
                  <p className="font-medium">Backend listo</p>
                  <p className="text-sm opacity-90">
                    La API esta consultando Jolokia y devolviendo datos normalizados para el dashboard.
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Ultima actualizacion visible:{" "}
                {query.dataUpdatedAt
                  ? new Intl.DateTimeFormat("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(new Date(query.dataUpdatedAt))
                  : "sin datos"}
              </div>
            </CardContent>
          </Card>
        </div>
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
