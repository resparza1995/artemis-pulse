import { Filter } from "lucide-react";
import { Input } from "../../ui/input";

type TopologyToolbarProps = {
  search: string;
  showConsumers: boolean;
  showDlq: boolean;
  onlyProblems: boolean;
  onSearchChange: (value: string) => void;
  onToggleConsumers: (value: boolean) => void;
  onToggleDlq: (value: boolean) => void;
  onToggleOnlyProblems: (value: boolean) => void;
};

export function TopologyToolbar({
  search,
  showConsumers,
  showDlq,
  onlyProblems,
  onSearchChange,
  onToggleConsumers,
  onToggleDlq,
  onToggleOnlyProblems,
}: TopologyToolbarProps) {
  return (
    <section className="app-panel-muted flex flex-none flex-wrap items-center gap-3 px-4 py-3">
      <div className="mr-2 flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Filtros
        </span>
      </div>

      <div className="min-w-[220px] flex-1">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por id o nombre..."
          className="h-10"
        />
      </div>

      <label className="app-toggle-shell inline-flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="app-checkbox h-4 w-4"
          checked={showConsumers}
          onChange={(event) => onToggleConsumers(event.target.checked)}
        />
        Mostrar consumers
      </label>

      <label className="app-toggle-shell inline-flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="app-checkbox h-4 w-4"
          checked={showDlq}
          onChange={(event) => onToggleDlq(event.target.checked)}
        />
        Mostrar DLQ
      </label>

      <label className="app-toggle-shell inline-flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="app-checkbox h-4 w-4"
          checked={onlyProblems}
          onChange={(event) => onToggleOnlyProblems(event.target.checked)}
        />
        Solo problemas
      </label>
    </section>
  );
}
