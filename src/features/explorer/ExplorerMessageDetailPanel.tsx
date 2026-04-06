import type { ReactNode } from "react";
import { FileSearch, RefreshCw } from "lucide-react";
import type { ExplorerMessageDetail } from "./types";
import type { QueueSummary } from "../../types/queues";
import { useI18n } from "../../i18n/react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";

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

function formatBody(body: string | null, messages: ReturnType<typeof useI18n>["messages"]) {
  if (!body) {
    return {
      label: messages.explorer.detail.text,
      content: messages.explorer.detail.noBody,
    };
  }

  const trimmed = body.trim();

  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      return {
        label: messages.explorer.detail.json,
        content: JSON.stringify(JSON.parse(trimmed), null, 2),
      };
    } catch {
      // fallback
    }
  }

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return {
      label: messages.explorer.detail.xml,
      content: formatXml(trimmed),
    };
  }

  return {
    label: messages.explorer.detail.text,
    content: body,
  };
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
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

function KeyValueGrid({ entries, emptyLabel }: { entries: [string, unknown][]; emptyLabel: string }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="app-panel-inset grid gap-1 px-3 py-2 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
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
  const { messages } = useI18n();
  const formattedBody = formatBody(detail?.body ?? null, messages);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-none gap-3 border-b border-[color:var(--border)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>{messages.explorer.detail.title}</CardTitle>
            <CardDescription>
              {queue
                ? `Queue ${queue.name}. ${messages.explorer.detail.headers}, ${messages.explorer.detail.body.toLowerCase()} y ${messages.explorer.detail.properties.toLowerCase()}.`
                : messages.explorer.detail.descriptionEmpty}
            </CardDescription>
          </div>
          <Button variant="secondary" onClick={onRefresh} disabled={!selectedMessageId || isFetching}>
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {isFetching ? messages.explorer.messagesPanel.refreshing : messages.common.refresh}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="app-scroll-y min-h-0 flex-1 space-y-4 pt-5">
        {!queue ? <div className="app-empty-state p-4 text-sm text-muted-foreground">{messages.explorer.detail.noQueue}</div> : null}
        {queue && !selectedMessageId && !isLoading ? <div className="app-empty-state p-4 text-sm text-muted-foreground">{messages.explorer.detail.noMessage}</div> : null}
        {queue && selectedMessageId && isLoading ? <div className="app-panel-soft p-4 text-sm text-muted-foreground">{messages.explorer.detail.loading}</div> : null}
        {queue && selectedMessageId && isError ? <div className="app-notice app-notice-critical text-sm">{errorMessage ?? messages.explorer.detail.fetchError}</div> : null}

        {queue && selectedMessageId && !isLoading && !isError && detail ? (
          <>
            <section className="app-panel-soft space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{detail.messageId}</Badge>
                {detail.contentType ? <Badge variant="outline">{detail.contentType}</Badge> : null}
                {detail.deliveryCount !== null ? <Badge variant="neutral">{messages.explorer.detail.delivery} {detail.deliveryCount}</Badge> : null}
                {detail.canRetrySafely ? <Badge variant="warning">{messages.explorer.detail.retrySafe}</Badge> : null}
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="app-panel-inset px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.explorer.detail.hour}</p><p className="mt-1 text-foreground">{renderTimestamp(detail.timestamp)}</p></div>
                <div className="app-panel-inset px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.explorer.detail.size}</p><p className="mt-1 text-foreground">{detail.size !== null ? numberFormatter.format(detail.size) : "-"}</p></div>
                <div className="app-panel-inset px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.explorer.detail.priority}</p><p className="mt-1 text-foreground">{detail.priority ?? "-"}</p></div>
                <div className="app-panel-inset px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.explorer.detail.brokerId}</p><p className="mt-1 text-foreground">{detail.brokerMessageId ?? "-"}</p></div>
                <div className="app-panel-inset px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.explorer.detail.currentQueue}</p><p className="mt-1 text-foreground">{queue.name}</p></div>
                <div className="app-panel-inset px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{messages.explorer.detail.origin}</p><p className="mt-1 text-foreground">{detail.originalQueue ?? detail.originalAddress ?? "-"}</p></div>
              </div>
            </section>

            <DetailSection title={`${messages.explorer.detail.body} (${formattedBody.label})`}>
              <div className="app-panel-inset overflow-x-auto p-3">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground/90">{formattedBody.content}</pre>
              </div>
            </DetailSection>

            <DetailSection title={messages.explorer.detail.headers}>
              <KeyValueGrid entries={Object.entries(detail.headers)} emptyLabel={messages.explorer.detail.noData} />
            </DetailSection>

            <DetailSection title={messages.explorer.detail.properties}>
              <KeyValueGrid entries={Object.entries(detail.properties)} emptyLabel={messages.explorer.detail.noData} />
            </DetailSection>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
