import { Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";

type QueueFiltersProps = {
  search: string;
  onlyWithMessages: boolean;
  onlyDlq: boolean;
  onSearchChange: (value: string) => void;
  onOnlyWithMessagesChange: (value: boolean) => void;
  onOnlyDlqChange: (value: boolean) => void;
};

export function QueueFilters({
  search,
  onlyWithMessages,
  onlyDlq,
  onSearchChange,
  onOnlyWithMessagesChange,
  onOnlyDlqChange,
}: QueueFiltersProps) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-11"
            placeholder="Buscar por nombre de cola"
          />
        </label>

        <div className="app-toggle-shell flex items-center gap-3 px-4 py-2.5">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={onlyWithMessages}
              onChange={(event) => onOnlyWithMessagesChange(event.target.checked)}
              className="app-checkbox h-4 w-4 rounded border-[color:var(--border)] bg-transparent"
            />
            solo con mensajes
          </label>
        </div>

        <div className="app-toggle-shell flex items-center gap-3 px-4 py-2.5">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={onlyDlq}
              onChange={(event) => onOnlyDlqChange(event.target.checked)}
              className="app-checkbox h-4 w-4 rounded border-[color:var(--border)] bg-transparent"
            />
            solo DLQ
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
