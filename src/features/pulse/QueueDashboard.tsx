import {
  Activity,
  AlertOctagon,
  DatabaseZap,
  Server,
} from "lucide-react";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import type { DemoProfileApplyResponse, DemoProfileState } from "../../types/demo";
import type { BrokerMetrics, QueueSummary } from "../../types/queues";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { QueueHealthBadge } from "./QueueHealthBadge";
import { StatsCard } from "./StatsCard";

type QueueDashboardProps = {
  pollIntervalMs: number;
  brokerLabel: string;
};

type QueueApiError = {
  message?: string;
};

function getApiErrorMessage(payload: unknown) {
  return payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
    ? payload.message
    : null;
}

function isDemoProfileState(payload: unknown): payload is DemoProfileState {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "enabled" in payload &&
      typeof payload.enabled === "boolean" &&
      "profiles" in payload &&
      Array.isArray(payload.profiles),
  );
}

function isDemoProfileApplyResponse(payload: unknown): payload is DemoProfileApplyResponse {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "appliedProfile" in payload &&
      typeof payload.appliedProfile === "string",
  );
}

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
      getApiErrorMessage(payload) ||
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

async function fetchDemoProfileState() {
  const response = await fetch("/api/demo/profile", {
    headers: {
      Accept: "application/json",
    },
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload) ||
        "No se pudo obtener el estado del simulador demo.",
    );
  }

  if (!isDemoProfileState(payload)) {
    throw new Error("La respuesta de perfiles demo no tiene el formato esperado.");
  }

  return payload;
}

async function applyDemoProfile(profile: string) {
  const response = await fetch("/api/demo/profile", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profile }),
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload) ||
        "No se pudo aplicar el perfil demo.",
    );
  }

  if (!isDemoProfileApplyResponse(payload)) {
    throw new Error("La respuesta de aplicar perfil demo no tiene el formato esperado.");
  }

  return payload;
}

function QueueDashboardContent({
  pollIntervalMs,
  brokerLabel,
}: QueueDashboardProps) {
  const queryClient = useQueryClient();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [selectedDemoProfile, setSelectedDemoProfile] = useState("");
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

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

  const demoProfileQuery = useQuery({
    queryKey: ["demoProfileState"],
    queryFn: fetchDemoProfileState,
    refetchInterval: pollIntervalMs * 2,
    refetchIntervalInBackground: true,
    retry: 0,
  });

  const applyDemoProfileMutation = useMutation({
    mutationFn: applyDemoProfile,
    onSuccess: async (result) => {
      setDemoNotice(`Perfil "${result.appliedProfile}" aplicado. Escenario reseteado.`);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["demoProfileState"] }),
        queryClient.invalidateQueries({ queryKey: ["queues"] }),
        queryClient.invalidateQueries({ queryKey: ["brokerMetrics"] }),
      ]);

      await Promise.all([queuesQuery.refetch(), brokerMetricsQuery.refetch()]);
    },
    onError: (error) => {
      setDemoNotice(
        error instanceof Error
          ? `No se pudo aplicar el perfil: ${error.message}`
          : "No se pudo aplicar el perfil demo.",
      );
    },
  });

  const queues = queuesQuery.data ?? [];
  const metrics = brokerMetricsQuery.data;
  const demoProfileState = demoProfileQuery.data;
  const demoControlEnabled = demoProfileState?.enabled ?? false;
  const availableProfiles: string[] = demoProfileState?.profiles ?? [];

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

  const effectiveSelectedProfile =
    selectedDemoProfile || demoProfileState?.currentProfile || availableProfiles[0] || "";

  async function handleManualRefresh() {
    setIsManualRefreshing(true);

    try {
      await Promise.all([
        queuesQuery.refetch(),
        brokerMetricsQuery.refetch(),
        demoProfileQuery.refetch(),
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4">
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

          <div className="app-panel-soft flex flex-wrap items-center gap-2 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Modo demo
            </span>
            <Badge
              variant={
                demoProfileQuery.isError
                  ? "critical"
                  : demoControlEnabled
                    ? "success"
                    : "warning"
              }
            >
              {demoProfileQuery.isError
                ? "Error"
                : demoControlEnabled
                  ? "Activo"
                  : "Desactivado"}
            </Badge>

            {demoControlEnabled ? (
              <>
                <span className="text-xs text-muted-foreground">Perfil</span>
                <div className="flex flex-wrap items-center gap-1 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-1">
                  {availableProfiles.map((profile: string) => {
                    const isSelected = profile === effectiveSelectedProfile;
                    return (
                      <button
                        key={profile}
                        type="button"
                        onClick={() => {
                          setSelectedDemoProfile(profile);
                          setDemoNotice(null);
                        }}
                        disabled={applyDemoProfileMutation.isPending}
                        className={[
                          "rounded-full px-3 py-1.5 text-xs font-medium transition",
                          isSelected
                            ? "border border-[var(--primary-border)] bg-[var(--primary-soft)] text-foreground"
                            : "border border-transparent text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                      >
                        {profile}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setDemoNotice(null);
                    void applyDemoProfileMutation.mutateAsync(effectiveSelectedProfile);
                  }}
                  disabled={
                    applyDemoProfileMutation.isPending ||
                    !effectiveSelectedProfile ||
                    availableProfiles.length === 0
                  }
                >
                  {applyDemoProfileMutation.isPending ? "Aplicando..." : "Aplicar perfil"}
                </Button>

                <span className="text-xs text-muted-foreground">
                  actual: {demoProfileState?.currentProfile ?? "n/a"}
                </span>

                {availableProfiles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    El simulador no devolvio perfiles.
                  </span>
                ) : null}
              </>
            ) : demoProfileQuery.isError ? (
              <span className="text-xs text-muted-foreground">
                No se pudo conectar con el simulador demo. Revisa `DEMO_CONTROL_BASE_URL`.
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Activalo con <code>DEMO_CONTROL_ENABLED=true</code> y reinicia la app.
              </span>
            )}
          </div>

          {queuesQuery.isError ? (
            <span className="text-xs text-[var(--critical)]">{queuesQuery.error.message}</span>
          ) : null}
          {!queuesQuery.isError && brokerMetricsQuery.isError ? (
            <span className="text-xs text-[var(--critical)]">{brokerMetricsQuery.error.message}</span>
          ) : null}
          {demoProfileQuery.isError ? (
            <span className="text-xs text-[var(--critical)]">
              Error en modo demo: {demoProfileQuery.error.message}
            </span>
          ) : null}
          {demoNotice ? (
            <span className="text-xs text-muted-foreground">{demoNotice}</span>
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
                    className="app-panel-soft flex flex-col gap-3 p-3"
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

                      <div className="grid grid-cols-2 gap-2 text-sm">
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

                    <div className="mt-1 flex items-center justify-end gap-3 border-t border-[color:var(--border)] pt-2">
                      <a
                        href={`/explorer?queue=${encodeURIComponent(queue.name)}`}
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
