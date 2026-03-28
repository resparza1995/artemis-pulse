import {
  ArrowUpDown,
  MoveRight,
  Redo2,
  RefreshCw,
  SendHorizontal,
  Trash,
  Trash2,
  Zap,
} from "lucide-react";
import type { ExplorerMessageSummary, QueueMessagesResponse } from "../../types/explorer";
import type { QueueSummary } from "../../types/queues";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { QueueHealthBadge } from "./QueueHealthBadge";

type MessageSortKey = "timestamp" | "priority" | "size";
type MessageSortDirection = "asc" | "desc";

type ExplorerMessagesPanelProps = {
  queue?: QueueSummary;
  data?: QueueMessagesResponse;
  items: ExplorerMessageSummary[];
  selectedMessageId: string;
  selectedMessageIds: string[];
  messageLimit: 100 | 250 | 500;
  messageFilter: string;
  messageSortKey: MessageSortKey;
  messageSortDirection: MessageSortDirection;
  onMessageLimitChange: (value: 100 | 250 | 500) => void;
  onMessageFilterChange: (value: string) => void;
  onMessageSortKeyChange: (value: MessageSortKey) => void;
  onToggleSortDirection: () => void;
  onSelectMessage: (messageId: string) => void;
  onToggleMessageSelection: (messageId: string) => void;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onRefresh: () => void;
  onOpenPublish: () => void;
  onOpenConsume: () => void;
  onOpenPurge: () => void;
  onOpenDeleteQueue: () => void;
  onOpenRetry: () => void;
  onOpenMove: () => void;
  canRetrySelection: boolean;
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
  items,
  selectedMessageId,
  selectedMessageIds,
  messageLimit,
  messageFilter,
  messageSortKey,
  messageSortDirection,
  onMessageLimitChange,
  onMessageFilterChange,
  onMessageSortKeyChange,
  onToggleSortDirection,
  onSelectMessage,
  onToggleMessageSelection,
  onSelectAllVisible,
  onClearSelection,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRefresh,
  onOpenPublish,
  onOpenConsume,
  onOpenPurge,
  onOpenDeleteQueue,
  onOpenRetry,
  onOpenMove,
  canRetrySelection,
}: ExplorerMessagesPanelProps) {
  const selectedVisibleCount = items.filter((message) => selectedMessageIds.includes(message.messageId)).length;
  const allVisibleSelected = items.length > 0 && selectedVisibleCount === items.length;
  const hasSelection = selectedMessageIds.length > 0;
  const hasFilterNoMatches = Boolean(queue && data && data.items.length > 0 && items.length === 0 && messageFilter.trim().length > 0);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-none gap-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>{queue ? queue.name : "Mensajes"}</CardTitle>
            <CardDescription>
              {queue
                ? `Address ${queue.address}. Se muestran hasta ${data?.limit ?? messageLimit} mensajes para inspeccion.`
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
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {!queue ? (
          <div className="flex h-full min-h-0 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Selecciona una queue desde el panel lateral para abrir sus mensajes.
          </div>
        ) : null}

        {queue && isLoading ? (
          <div className="flex h-full min-h-0 items-center justify-center px-6 text-sm text-muted-foreground">
            Cargando mensajes de la queue seleccionada...
          </div>
        ) : null}

        {queue && isError ? (
          <div className="app-notice app-notice-critical m-5 text-sm">
            {errorMessage ?? "No se pudieron obtener los mensajes de la queue."}
          </div>
        ) : null}

        {queue && !isLoading && !isError && data ? (
          <div className="flex h-full min-h-0 flex-col gap-3 p-5">
            <div className="flex flex-none flex-wrap items-center gap-2">
              <Badge variant="neutral">{numberFormatter.format(items.length)} visibles</Badge>
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

            <div className="grid flex-none gap-3 xl:grid-cols-[minmax(0,1fr)_140px_180px_120px]">
              <Input
                value={messageFilter}
                onChange={(event) => onMessageFilterChange(event.target.value)}
                placeholder="Filtrar por ID, content-type o preview"
              />
              <select
                value={String(messageLimit)}
                onChange={(event) => onMessageLimitChange(Number(event.target.value) as 100 | 250 | 500)}
                className="app-control app-select flex h-11 px-4 py-2 text-sm"
              >
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
              <select
                value={messageSortKey}
                onChange={(event) => onMessageSortKeyChange(event.target.value as MessageSortKey)}
                className="app-control app-select flex h-11 px-4 py-2 text-sm"
              >
                <option value="timestamp">Ordenar por hora</option>
                <option value="priority">Ordenar por prioridad</option>
                <option value="size">Ordenar por tamano</option>
              </select>
              <Button variant="secondary" onClick={onToggleSortDirection}>
                <ArrowUpDown className="h-4 w-4" />
                {messageSortDirection === "desc" ? "Desc" : "Asc"}
              </Button>
            </div>

            {hasSelection ? (
              <div className="app-panel-soft flex flex-none flex-wrap items-center gap-2 p-3">
                <Badge variant="neutral">{selectedMessageIds.length} seleccionados</Badge>
                <Button variant="secondary" onClick={onOpenRetry} disabled={!canRetrySelection}>
                  <Redo2 className="h-4 w-4" />
                  Retry
                </Button>
                <Button variant="secondary" onClick={onOpenMove}>
                  <MoveRight className="h-4 w-4" />
                  Move
                </Button>
                <Button variant="ghost" onClick={onClearSelection}>
                  Clear selection
                </Button>
              </div>
            ) : null}

            {data.items.length === 0 ? (
              <div className="app-empty-state flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Esta queue no tiene mensajes disponibles ahora mismo.
              </div>
            ) : hasFilterNoMatches ? (
              <div className="app-empty-state flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                No hay mensajes que coincidan con el filtro actual dentro de los mensajes cargados.
              </div>
            ) : (
              <div className="app-table-shell min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={() => onSelectAllVisible()}
                          className="app-checkbox h-4 w-4"
                          aria-label="Seleccionar todos los mensajes visibles"
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Prioridad</TableHead>
                      <TableHead className="text-right">Tamano</TableHead>
                      <TableHead>Content-Type</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((message) => {
                      const isSelectedRow = message.messageId === selectedMessageId;
                      const isChecked = selectedMessageIds.includes(message.messageId);

                      return (
                        <TableRow
                          key={message.messageId}
                          data-state={isSelectedRow ? "selected" : undefined}
                          className="cursor-pointer"
                          onClick={() => onSelectMessage(message.messageId)}
                        >
                          <TableCell className="w-12 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => onToggleMessageSelection(message.messageId)}
                              className="app-checkbox h-4 w-4"
                              aria-label={`Seleccionar mensaje ${message.messageId}`}
                            />
                          </TableCell>
                          <TableCell className="max-w-[220px] font-medium text-foreground">
                            <span className="block truncate">{message.messageId}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {renderTimestamp(message.timestamp)}
                          </TableCell>
                          <TableCell className="text-right">{message.priority ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            {message.size !== null ? numberFormatter.format(message.size) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[180px] text-sm text-muted-foreground">
                            <span className="block truncate">{message.contentType ?? "-"}</span>
                          </TableCell>
                          <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                            <span className="block truncate">{message.originalQueue ?? message.originalAddress ?? "-"}</span>
                          </TableCell>
                          <TableCell className="max-w-[320px] text-sm text-muted-foreground">
                            <span className="block truncate">{message.preview ?? "Sin preview disponible"}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
