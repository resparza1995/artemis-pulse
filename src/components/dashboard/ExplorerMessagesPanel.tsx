import { RefreshCw, SendHorizontal, Trash, Trash2, Zap } from "lucide-react";
import type { QueueMessagesResponse } from "../../types/explorer";
import type { QueueSummary } from "../../types/queues";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { QueueHealthBadge } from "./QueueHealthBadge";

type ExplorerMessagesPanelProps = {
  queue?: QueueSummary;
  data?: QueueMessagesResponse;
  selectedMessageId: string;
  onSelectMessage: (messageId: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onRefresh: () => void;
  onOpenPublish: () => void;
  onOpenConsume: () => void;
  onOpenPurge: () => void;
  onOpenDeleteQueue: () => void;
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

export function ExplorerMessagesPanel({
  queue,
  data,
  selectedMessageId,
  onSelectMessage,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRefresh,
  onOpenPublish,
  onOpenConsume,
  onOpenPurge,
  onOpenDeleteQueue,
}: ExplorerMessagesPanelProps) {
  return (
    <Card className="min-h-[640px]">
      <CardHeader className="gap-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>{queue ? queue.name : "Mensajes"}</CardTitle>
            <CardDescription>
              {queue
                ? `Address ${queue.address}. Se muestran hasta ${data?.limit ?? 100} mensajes para inspeccion.`
                : "Selecciona una queue para cargar sus mensajes."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {queue ? <QueueHealthBadge status={queue.status} /> : null}
            {queue?.isDlq ? <Badge variant="outline">DLQ</Badge> : null}
            <Button variant="secondary" onClick={onOpenPublish} disabled={!queue}>
              <SendHorizontal className="h-4 w-4" />
              Publish
            </Button>
            <Button variant="secondary" onClick={onOpenConsume} disabled={!queue}>
              <Zap className="h-4 w-4" />
              Consume
            </Button>
            <Button variant="secondary" onClick={onOpenPurge} disabled={!queue}>
              <Trash className="h-4 w-4" />
              Limpiar
            </Button>
            <Button variant="secondary" onClick={onOpenDeleteQueue} disabled={!queue}>
              <Trash2 className="h-4 w-4" />
              Eliminar queue
            </Button>
            <Button variant="secondary" onClick={onRefresh} disabled={!queue || isFetching}>
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {isFetching ? "Actualizando" : "Refrescar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!queue ? (
          <div className="flex min-h-[540px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Selecciona una queue desde el panel lateral para abrir sus mensajes.
          </div>
        ) : null}

        {queue && isLoading ? (
          <div className="flex min-h-[540px] items-center justify-center px-6 text-sm text-muted-foreground">
            Cargando mensajes de la queue seleccionada...
          </div>
        ) : null}

        {queue && isError ? (
          <div className="app-notice app-notice-critical m-5 text-sm">
            {errorMessage ?? "No se pudieron obtener los mensajes de la queue."}
          </div>
        ) : null}

        {queue && !isLoading && !isError && data ? (
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{numberFormatter.format(data.items.length)} cargados</Badge>
              {typeof data.totalKnownMessages === "number" ? (
                <Badge variant="neutral">
                  {numberFormatter.format(data.totalKnownMessages)} detectados
                </Badge>
              ) : null}
              {data.truncated ? (
                <Badge variant="warning">lista truncada a {data.limit}</Badge>
              ) : null}
            </div>

            {data.items.length === 0 ? (
              <div className="app-empty-state flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Esta queue no tiene mensajes disponibles ahora mismo.
              </div>
            ) : (
              <div className="app-table-shell overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Prioridad</TableHead>
                      <TableHead className="text-right">Tamano</TableHead>
                      <TableHead>Content-Type</TableHead>
                      <TableHead>Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((message) => (
                      <TableRow
                        key={message.messageId}
                        data-state={message.messageId === selectedMessageId ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => onSelectMessage(message.messageId)}
                      >
                        <TableCell className="max-w-[220px] font-medium text-foreground">
                          <span className="block truncate">{message.messageId}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {renderTimestamp(message.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          {message.priority ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {message.size !== null ? numberFormatter.format(message.size) : "-"}
                        </TableCell>
                        <TableCell className="max-w-[180px] text-sm text-muted-foreground">
                          <span className="block truncate">{message.contentType ?? "-"}</span>
                        </TableCell>
                        <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                          <span className="block truncate">{message.preview ?? "Sin preview disponible"}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
