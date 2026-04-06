import { ChevronDown, ChevronRight, Search, Settings2 } from "lucide-react";
import type { QueueSummary } from "../../types/queues";
import { useI18n } from "../../i18n/react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { QueueHealthBadge } from "../pulse/QueueHealthBadge";

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
  onOpenAdmin: () => void;
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
  onOpenAdmin,
}: ExplorerSidebarProps) {
  const { messages } = useI18n();
  const totalQueues = groups.reduce((total, group) => total + group.queues.length, 0);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-none gap-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{messages.explorer.sidebar.title}</CardTitle>
          <Badge variant="neutral">{numberFormatter.format(totalQueues)} {messages.explorer.sidebar.visible}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="px-3" onClick={onOpenAdmin}>
            <Settings2 className="h-4 w-4" />
            {messages.explorer.sidebar.manage}
          </Button>
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-11"
            placeholder={messages.explorer.sidebar.searchPlaceholder}
          />
        </label>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden px-0 pb-0">
        {isLoading ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">{messages.explorer.sidebar.loading}</div>
        ) : null}

        {isError ? (
          <div className="app-notice app-notice-critical mx-5 text-sm">
            {errorMessage ?? messages.explorer.sidebar.fetchError}
          </div>
        ) : null}

        {!isLoading && !isError && groups.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            {messages.explorer.sidebar.noMatches}
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="app-scroll-y h-full pb-4">
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
                                    {numberFormatter.format(queue.messageCount)} {messages.explorer.sidebar.messages}
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
  )
}
