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
import type { ExplorerMessageSummary, QueueMessagesResponse } from "./types";
import type { QueueSummary } from "../../types/queues";
import { useI18n } from "../../i18n/react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { QueueHealthBadge } from "../pulse/QueueHealthBadge";

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
  onRetryAll: () => void;
  onMoveAll: () => void;
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
  onRetryAll,
  onMoveAll,
  canRetrySelection,
}: ExplorerMessagesPanelProps) {
  const { messages } = useI18n();
  const selectedVisibleCount = items.filter((message) => selectedMessageIds.includes(message.messageId)).length;
  const allVisibleSelected = items.length > 0 && selectedVisibleCount === items.length;
  const hasSelection = selectedMessageIds.length > 0;
  const hasFilterNoMatches = Boolean(queue && data && data.items.length > 0 && items.length === 0 && messageFilter.trim().length > 0);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-none gap-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>{queue ? queue.name : messages.explorer.messagesPanel.title}</CardTitle>
            <CardDescription>
              {queue
                ? `Address ${queue.address}. ${messages.explorer.messagesPanel.loaded}: ${data?.limit ?? messageLimit}.`
                : messages.explorer.messagesPanel.descriptionEmpty}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {queue ? <QueueHealthBadge status={queue.status} /> : null}
            {queue?.isDlq ? <Badge variant="outline">DLQ</Badge> : null}
            <Button variant="secondary" onClick={onOpenPublish} disabled={!queue}><SendHorizontal className="h-4 w-4" />{messages.explorer.messagesPanel.publish}</Button>
            <Button variant="secondary" onClick={onOpenConsume} disabled={!queue}><Zap className="h-4 w-4" />{messages.explorer.messagesPanel.consume}</Button>
            <Button variant="secondary" onClick={onOpenPurge} disabled={!queue}><Trash className="h-4 w-4" />{messages.explorer.messagesPanel.purge}</Button>
            <Button variant="secondary" onClick={onOpenDeleteQueue} disabled={!queue}><Trash2 className="h-4 w-4" />{messages.explorer.messagesPanel.deleteQueue}</Button>
            <Button variant="secondary" onClick={onRefresh} disabled={!queue || isFetching}><RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />{isFetching ? messages.explorer.messagesPanel.refreshing : messages.explorer.messagesPanel.refresh}</Button>
          </div>
        </div>
      </CardHeader>
      {queue?.isDlq && data && data.items.length > 0 ? (
        <div className="flex flex-none flex-wrap items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--surface-raised)] px-5 py-2.5 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">DLQ</span>
          <span className="text-muted-foreground">{data.items.length} {messages.explorer.messagesPanel.loaded}</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onRetryAll} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-600">{messages.explorer.messagesPanel.retryAll}</button>
            <button type="button" onClick={onMoveAll} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600">{messages.explorer.messagesPanel.moveAll}</button>
          </div>
        </div>
      ) : null}
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {!queue ? <div className="flex h-full min-h-0 items-center justify-center px-6 text-center text-sm text-muted-foreground">{messages.explorer.messagesPanel.selectQueuePrompt}</div> : null}
        {queue && isLoading ? <div className="flex h-full min-h-0 items-center justify-center px-6 text-sm text-muted-foreground">{messages.explorer.messagesPanel.loading}</div> : null}
        {queue && isError ? <div className="app-notice app-notice-critical m-5 text-sm">{errorMessage ?? messages.explorer.messagesPanel.fetchError}</div> : null}

        {queue && !isLoading && !isError && data ? (
          <div className="flex h-full min-h-0 flex-col gap-3 p-5">
            <div className="flex flex-none flex-wrap items-center gap-2">
              <Badge variant="neutral">{numberFormatter.format(items.length)} {messages.explorer.messagesPanel.visible}</Badge>
              <Badge variant="neutral">{numberFormatter.format(data.items.length)} {messages.explorer.messagesPanel.loaded}</Badge>
              {typeof data.totalKnownMessages === "number" ? <Badge variant="neutral">{numberFormatter.format(data.totalKnownMessages)} {messages.explorer.messagesPanel.detected}</Badge> : null}
              {data.truncated ? <Badge variant="warning">{messages.explorer.messagesPanel.loaded} {data.limit}</Badge> : null}
            </div>

            <div className="grid flex-none gap-3 xl:grid-cols-[minmax(0,1fr)_140px_180px_120px]">
              <Input value={messageFilter} onChange={(event) => onMessageFilterChange(event.target.value)} placeholder={messages.explorer.messagesPanel.filterPlaceholder} />
              <select value={String(messageLimit)} onChange={(event) => onMessageLimitChange(Number(event.target.value) as 100 | 250 | 500)} className="app-control app-select h-11 px-4 py-2 text-sm">
                <option value="100">100</option><option value="250">250</option><option value="500">500</option>
              </select>
              <select value={messageSortKey} onChange={(event) => onMessageSortKeyChange(event.target.value as MessageSortKey)} className="app-control app-select h-11 px-4 py-2 text-sm">
                <option value="timestamp">{messages.explorer.messagesPanel.sortByTime}</option>
                <option value="priority">{messages.explorer.messagesPanel.sortByPriority}</option>
                <option value="size">{messages.explorer.messagesPanel.sortBySize}</option>
              </select>
              <Button variant="secondary" onClick={onToggleSortDirection}><ArrowUpDown className="h-4 w-4" />{messageSortDirection === "desc" ? messages.explorer.messagesPanel.desc : messages.explorer.messagesPanel.asc}</Button>
            </div>

            {hasSelection ? (
              <div className="app-panel-soft flex flex-none flex-wrap items-center gap-2 p-3">
                <Badge variant="neutral">{selectedMessageIds.length} {messages.common.selected}</Badge>
                <Button variant="secondary" onClick={onOpenRetry} disabled={!canRetrySelection}><Redo2 className="h-4 w-4" />{messages.explorer.messagesPanel.retry}</Button>
                <Button variant="secondary" onClick={onOpenMove}><MoveRight className="h-4 w-4" />{messages.explorer.messagesPanel.move}</Button>
                <Button variant="ghost" onClick={onClearSelection}>{messages.explorer.messagesPanel.clearSelection}</Button>
              </div>
            ) : null}

            {data.items.length === 0 ? (
              <div className="app-empty-state flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">{messages.explorer.messagesPanel.emptyQueue}</div>
            ) : hasFilterNoMatches ? (
              <div className="app-empty-state flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">{messages.explorer.messagesPanel.noFilterMatches}</div>
            ) : (
              <div className="app-table-shell min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">
                        <input type="checkbox" checked={allVisibleSelected} onChange={() => onSelectAllVisible()} className="app-checkbox h-4 w-4" aria-label="Select all visible messages" />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>{messages.explorer.messagesPanel.hour}</TableHead>
                      <TableHead className="text-right">{messages.explorer.messagesPanel.priority}</TableHead>
                      <TableHead className="text-right">{messages.explorer.messagesPanel.size}</TableHead>
                      <TableHead>{messages.explorer.messagesPanel.contentType}</TableHead>
                      <TableHead>{messages.explorer.messagesPanel.origin}</TableHead>
                      <TableHead>{messages.explorer.messagesPanel.preview}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((message) => {
                      const isSelectedRow = message.messageId === selectedMessageId;
                      const isChecked = selectedMessageIds.includes(message.messageId);

                      return (
                        <TableRow key={message.messageId} data-state={isSelectedRow ? "selected" : undefined} className="cursor-pointer" onClick={() => onSelectMessage(message.messageId)}>
                          <TableCell className="w-12 text-center">
                            <input type="checkbox" checked={isChecked} onClick={(event) => event.stopPropagation()} onChange={() => onToggleMessageSelection(message.messageId)} className="app-checkbox h-4 w-4" aria-label={`Select message ${message.messageId}`} />
                          </TableCell>
                          <TableCell className="max-w-[220px] font-medium text-foreground"><span className="block truncate">{message.messageId}</span></TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{renderTimestamp(message.timestamp)}</TableCell>
                          <TableCell className="text-right">{message.priority ?? "-"}</TableCell>
                          <TableCell className="text-right">{message.size !== null ? numberFormatter.format(message.size) : "-"}</TableCell>
                          <TableCell className="max-w-[180px] text-sm text-muted-foreground"><span className="block truncate">{message.contentType ?? "-"}</span></TableCell>
                          <TableCell className="max-w-[220px] text-sm text-muted-foreground"><span className="block truncate">{message.originalQueue ?? message.originalAddress ?? "-"}</span></TableCell>
                          <TableCell className="max-w-[320px] text-sm text-muted-foreground"><span className="block truncate">{message.preview ?? messages.explorer.messagesPanel.noPreview}</span></TableCell>
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
