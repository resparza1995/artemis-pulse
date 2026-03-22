import { ChevronDown, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import type { QueueSummary } from "../../types/queues";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { QueueHealthBadge } from "./QueueHealthBadge";

type QueueGroup = {
  address: string;
  queues: QueueSummary[];
};

type ExplorerSidebarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  groups: QueueGroup[];
  expandedAddresses: Record<string, boolean>;
  onToggleAddress: (address: string) => void;
  selectedQueueName: string;
  onSelectQueue: (queueName: string) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onOpenCreateAddress: () => void;
  onOpenCreateQueue: () => void;
  onOpenDeleteAddress: () => void;
};

const numberFormatter = new Intl.NumberFormat("es-ES");

export function ExplorerSidebar({
  search,
  onSearchChange,
  groups,
  expandedAddresses,
  onToggleAddress,
  selectedQueueName,
  onSelectQueue,
  isLoading,
  isError,
  errorMessage,
  onOpenCreateAddress,
  onOpenCreateQueue,
  onOpenDeleteAddress,
}: ExplorerSidebarProps) {
  const totalQueues = groups.reduce((total, group) => total + group.queues.length, 0);

  return (
    <Card className="min-h-[640px]">
      <CardHeader className="gap-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Queues</CardTitle>
          <Badge variant="neutral">{numberFormatter.format(totalQueues)} visibles</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="px-3" onClick={onOpenCreateAddress}>
            <Plus className="h-4 w-4" />
            Address
          </Button>
          <Button variant="secondary" className="px-3" onClick={onOpenCreateQueue}>
            <Plus className="h-4 w-4" />
            Queue
          </Button>
          <Button variant="secondary" className="px-3" onClick={onOpenDeleteAddress}>
            <Trash2 className="h-4 w-4" />
            Eliminar address
          </Button>
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-11"
            placeholder="Buscar queue o address"
          />
        </label>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">Cargando queues...</div>
        ) : null}

        {isError ? (
          <div className="app-notice app-notice-critical mx-5 text-sm">
            {errorMessage ?? "No se pudieron obtener las queues del broker."}
          </div>
        ) : null}

        {!isLoading && !isError && groups.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            No hay queues que coincidan con la busqueda actual.
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="max-h-[720px] overflow-y-auto pb-4">
            {groups.map((group) => {
              const isExpanded = expandedAddresses[group.address] ?? true;

              return (
                <div key={group.address} className="border-b border-[color:var(--border)] last:border-b-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-[rgba(255,255,255,0.035)]"
                    onClick={() => onToggleAddress(group.address)}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="truncate">{group.address}</span>
                    </div>
                    <Badge variant="neutral">{group.queues.length}</Badge>
                  </button>

                  {isExpanded ? (
                    <div className="space-y-1 px-3 pb-3">
                      {group.queues.map((queue) => {
                        const isSelected = queue.name === selectedQueueName;

                        return (
                          <button
                            key={queue.name}
                            type="button"
                            onClick={() => onSelectQueue(queue.name)}
                            className={[
                              "w-full rounded-2xl border px-3 py-3 text-left transition",
                              isSelected
                                ? "border-[color:var(--primary-border)] bg-[var(--primary-soft)]"
                                : "border-transparent bg-transparent hover:border-[color:var(--border)] hover:bg-[rgba(255,255,255,0.035)]",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {queue.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  {queue.isDlq ? <Badge variant="outline">DLQ</Badge> : null}
                                  <span className="text-xs text-muted-foreground">
                                    {numberFormatter.format(queue.messageCount)} mensajes
                                  </span>
                                </div>
                              </div>
                              <QueueHealthBadge status={queue.status} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
