import type { ReactNode } from "react";
import { FileSearch, RefreshCw } from "lucide-react";
import type { ExplorerMessageDetail } from "../../types/explorer";
import type { QueueSummary } from "../../types/queues";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type ExplorerMessageDetailPanelProps = {
  queue?: QueueSummary;
  selectedMessageId: string;
  detail?: ExplorerMessageDetail;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onRefresh: () => void;
};

const numberFormatter = new Intl.NumberFormat("es-ES");
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function renderTimestamp(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatXml(input: string) {
  const tokens = input.replace(/>\s*</g, "><").split(/(?=<)|(?<=>)/g).filter(Boolean);
  let indent = 0;

  return tokens
    .map((token) => {
      if (/^<\//.test(token)) {
        indent = Math.max(indent - 1, 0);
      }

      const line = `${"  ".repeat(indent)}${token}`;

      if (/^<[^!?/][^>]*[^/]>$/.test(token)) {
        indent += 1;
      }

      return line;
    })
    .join("\n");
}

function formatBody(body: string | null) {
  if (!body) {
    return {
      label: "Texto",
      content: "Sin body legible para este mensaje.",
    };
  }

  const trimmed = body.trim();

  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      return {
        label: "JSON",
        content: JSON.stringify(JSON.parse(trimmed), null, 2),
      };
    } catch {
      // Fallback to the raw body below.
    }
  }

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return {
      label: "XML",
      content: formatXml(trimmed),
    };
  }

  return {
    label: "Texto",
    content: body,
  };
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="app-panel-soft space-y-3 p-4">
      <div className="flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-primary/80" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function KeyValueGrid({ entries }: { entries: [string, unknown][] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos disponibles.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="app-panel-inset grid gap-1 px-3 py-2 text-sm sm:grid-cols-[140px_minmax(0,1fr)]"
        >
          <span className="text-muted-foreground">{key}</span>
          <span className="break-words text-foreground">{typeof value === "string" ? value : JSON.stringify(value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ExplorerMessageDetailPanel({
  queue,
  selectedMessageId,
  detail,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRefresh,
}: ExplorerMessageDetailPanelProps) {
  const formattedBody = formatBody(detail?.body ?? null);

  return (
    <Card className="min-h-[360px] max-h-[calc(100vh-180px)] xl:sticky xl:top-6 overflow-hidden">
      <CardHeader className="gap-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Detalle del mensaje</CardTitle>
            <CardDescription>
              {queue
                ? `Queue ${queue.name}. Inspecciona metadatos, body y properties del mensaje seleccionado.`
                : "Selecciona una queue para empezar a inspeccionar mensajes."}
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={!selectedMessageId || isFetching}
          >
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {isFetching ? "Actualizando" : "Refrescar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5 overflow-y-auto max-h-[calc(100vh-260px)]">
        {!queue ? (
          <div className="app-empty-state p-4 text-sm text-muted-foreground">
            Todavia no hay una queue seleccionada.
          </div>
        ) : null}

        {queue && !selectedMessageId && !isLoading ? (
          <div className="app-empty-state p-4 text-sm text-muted-foreground">
            Selecciona un mensaje de la lista para ver su detalle.
          </div>
        ) : null}

        {queue && selectedMessageId && isLoading ? (
          <div className="app-panel-soft p-4 text-sm text-muted-foreground">
            Cargando detalle del mensaje...
          </div>
        ) : null}

        {queue && selectedMessageId && isError ? (
          <div className="app-notice app-notice-critical text-sm">
            {errorMessage ?? "No se pudo obtener el detalle del mensaje."}
          </div>
        ) : null}

        {queue && selectedMessageId && !isLoading && !isError && detail ? (
          <>
            <section className="app-panel-soft space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{detail.messageId}</Badge>
                {detail.contentType ? <Badge variant="outline">{detail.contentType}</Badge> : null}
                {detail.deliveryCount !== null ? (
                  <Badge variant="neutral">delivery {detail.deliveryCount}</Badge>
                ) : null}
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="app-panel-inset px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hora</p>
                  <p className="mt-1 text-foreground">{renderTimestamp(detail.timestamp)}</p>
                </div>
                <div className="app-panel-inset px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tamano</p>
                  <p className="mt-1 text-foreground">
                    {detail.size !== null ? numberFormatter.format(detail.size) : "-"}
                  </p>
                </div>
                <div className="app-panel-inset px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prioridad</p>
                  <p className="mt-1 text-foreground">{detail.priority ?? "-"}</p>
                </div>
                <div className="app-panel-inset px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Queue</p>
                  <p className="mt-1 text-foreground">{queue.name}</p>
                </div>
              </div>
            </section>

            <DetailSection title={`Body (${formattedBody.label})`}>
              <div className="app-panel-inset overflow-x-auto p-3">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground/90">
                  {formattedBody.content}
                </pre>
              </div>
            </DetailSection>

            <DetailSection title="Headers">
              <KeyValueGrid entries={Object.entries(detail.headers)} />
            </DetailSection>

            <DetailSection title="Properties">
              <KeyValueGrid entries={Object.entries(detail.properties)} />
            </DetailSection>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
