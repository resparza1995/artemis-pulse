import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { TopologyGraph, TopologyNode, TopologyResponse } from "../../types/topology";
import { Input } from "../ui/input";
import { TopologyCanvas } from "./TopologyCanvas";
import { TopologyDetailPanel } from "./TopologyDetailPanel";
import { TopologyLegend } from "./TopologyLegend";
import { TopologyToolbar } from "./TopologyToolbar";

type TopologyViewProps = {
  pollIntervalMs: number;
};

type TopologyViewContentProps = TopologyViewProps;

type TopologyUiState = {
  search: string;
  showConsumers: boolean;
  showDlq: boolean;
  onlyProblems: boolean;
  selectedNodeId: string | null;
  collapsedAddressIds: string[];
  viewport: { x: number; y: number; zoom: number } | null;
};

const STORAGE_KEY = "artemis-pulse.topology.ui.v1";
const TOPOLOGY_SELECTOR_STRESS_ITEMS = 0;

async function fetchTopology() {
  const response = await fetch("/api/topology", {
    headers: { Accept: "application/json" },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "No se pudo cargar la topologia.";
    throw new Error(message);
  }

  if (!payload || typeof payload !== "object" || !("graph" in payload)) {
    throw new Error("La API de topologia devolvio un formato no esperado.");
  }

  return payload as TopologyResponse;
}

function buildNodeMap(nodes: TopologyNode[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function collectAncestors(node: TopologyNode, nodeMap: Map<string, TopologyNode>) {
  const ids = new Set<string>();
  let currentParentId = node.meta?.parentId;

  while (currentParentId) {
    ids.add(currentParentId);
    currentParentId = nodeMap.get(currentParentId)?.meta?.parentId;
  }

  return ids;
}

function readInitialUiState(): TopologyUiState {
  if (typeof window === "undefined") {
    return {
      search: "",
      showConsumers: true,
      showDlq: true,
      onlyProblems: false,
      selectedNodeId: "broker-main",
      collapsedAddressIds: [],
      viewport: null,
    };
  }

  const params = new URLSearchParams(window.location.search);
  let persisted: Partial<TopologyUiState> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      persisted = JSON.parse(raw) as Partial<TopologyUiState>;
    }
  } catch {
    persisted = {};
  }

  const toBoolean = (value: string | null, fallback: boolean) => {
    if (value === null) {
      return fallback;
    }
    return value !== "0" && value !== "false";
  };

  const collapsedFromUrl = params.get("collapsed");
  const collapsedAddressIds = collapsedFromUrl
    ? collapsedFromUrl
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : persisted.collapsedAddressIds ?? [];

  return {
    search: params.get("q") ?? persisted.search ?? "",
    showConsumers: toBoolean(params.get("consumers"), persisted.showConsumers ?? true),
    showDlq: toBoolean(params.get("dlq"), persisted.showDlq ?? true),
    onlyProblems: toBoolean(params.get("problems"), persisted.onlyProblems ?? false),
    selectedNodeId: params.get("node") ?? persisted.selectedNodeId ?? "broker-main",
    collapsedAddressIds,
    viewport:
      typeof persisted.viewport?.x === "number" &&
      typeof persisted.viewport?.y === "number" &&
      typeof persisted.viewport?.zoom === "number"
        ? persisted.viewport
        : null,
  };
}

function shouldHideByCollapsedAddress(node: TopologyNode, nodeMap: Map<string, TopologyNode>, collapsedAddressIds: Set<string>) {
  let parentId = node.meta?.parentId;
  while (parentId) {
    if (collapsedAddressIds.has(parentId)) {
      return true;
    }
    parentId = nodeMap.get(parentId)?.meta?.parentId;
  }
  return false;
}

function filterGraph(
  graph: TopologyGraph,
  options: {
    search: string;
    showConsumers: boolean;
    showDlq: boolean;
    onlyProblems: boolean;
    collapsedAddressIds: Set<string>;
  },
) {
  const query = options.search.trim().toLowerCase();
  const allNodeMap = buildNodeMap(graph.nodes);

  const baseNodes = graph.nodes.filter((node) => {
    if (!options.showConsumers && node.type === "consumer") {
      return false;
    }

    if (!options.showDlq && node.type === "queue" && node.meta?.isDlq) {
      return false;
    }

    if (shouldHideByCollapsedAddress(node, allNodeMap, options.collapsedAddressIds) && node.type !== "address") {
      return false;
    }

    return true;
  });

  if (!query && !options.onlyProblems) {
    const visibleIds = new Set(baseNodes.map((node) => node.id));
    return {
      nodes: baseNodes,
      edges: graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)),
    };
  }

  const nodeMap = buildNodeMap(baseNodes);
  const focusNodeIds = new Set<string>();
  const matchedNodeIds = new Set<string>();

  for (const node of baseNodes) {
    const matchesSearch =
      query.length === 0 ||
      node.label.toLowerCase().includes(query) ||
      node.id.toLowerCase().includes(query);
    const isProblem = node.status === "warning" || node.status === "critical" || node.status === "inactive";
    const shouldInclude = (query ? matchesSearch : true) && (!options.onlyProblems || isProblem);

    if (shouldInclude) {
      matchedNodeIds.add(node.id);
      focusNodeIds.add(node.id);
      for (const ancestorId of collectAncestors(node, nodeMap)) {
        focusNodeIds.add(ancestorId);
      }
    }
  }

  for (const matchedNodeId of matchedNodeIds) {
    for (const edge of graph.edges) {
      if (edge.source === matchedNodeId && nodeMap.has(edge.target)) {
        focusNodeIds.add(edge.target);
      }
      if (edge.target === matchedNodeId && nodeMap.has(edge.source)) {
        focusNodeIds.add(edge.source);
      }
    }
  }

  const nodes = baseNodes.filter((node) => focusNodeIds.has(node.id));
  const visibleIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));

  return { nodes, edges };
}

function TopologyViewContent({ pollIntervalMs }: TopologyViewContentProps) {
  const initialUiState = useMemo(() => readInitialUiState(), []);
  const [search, setSearch] = useState(initialUiState.search);
  const [showConsumers, setShowConsumers] = useState(initialUiState.showConsumers);
  const [showDlq, setShowDlq] = useState(initialUiState.showDlq);
  const [onlyProblems, setOnlyProblems] = useState(initialUiState.onlyProblems);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialUiState.selectedNodeId);
  const [collapsedAddressIds, setCollapsedAddressIds] = useState<Set<string>>(
    () => new Set(initialUiState.collapsedAddressIds),
  );
  const [addressSearch, setAddressSearch] = useState("");
  const [viewport, setViewport] = useState<{ x: number; y: number; zoom: number } | null>(initialUiState.viewport);
  const addressListParentRef = useRef<HTMLDivElement | null>(null);
  const deferredSearch = useDeferredValue(search);

  const topologyQuery = useQuery({
    queryKey: ["topology"],
    queryFn: fetchTopology,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: Math.max(3000, pollIntervalMs),
  });

  const graph = topologyQuery.data?.graph ?? { nodes: [], edges: [] };
  const filteredGraph = useMemo(
    () =>
      filterGraph(graph, {
        search: deferredSearch,
        showConsumers,
        showDlq,
        onlyProblems,
        collapsedAddressIds,
      }),
    [graph, deferredSearch, showConsumers, showDlq, onlyProblems, collapsedAddressIds],
  );

  const addressNodes = useMemo(
    () => graph.nodes.filter((node) => node.type === "address").sort((left, right) => left.label.localeCompare(right.label)),
    [graph.nodes],
  );
  const selectorAddressNodes = useMemo(() => {
    if (TOPOLOGY_SELECTOR_STRESS_ITEMS <= 0) {
      return addressNodes;
    }

    const synthetic = Array.from({ length: TOPOLOGY_SELECTOR_STRESS_ITEMS }, (_, index) => ({
      id: `stress-address-${String(index + 1).padStart(3, "0")}`,
      type: "address" as const,
      label: `demo.address.${String(index + 1).padStart(3, "0")}`,
      status: "healthy" as const,
      position: { x: 0, y: 0 },
      meta: {},
    }));

    return [...addressNodes, ...synthetic].sort((left, right) => left.label.localeCompare(right.label));
  }, [addressNodes]);
  const filteredAddressNodes = useMemo(() => {
    const query = addressSearch.trim().toLowerCase();
    if (!query) {
      return selectorAddressNodes;
    }
    return selectorAddressNodes.filter((node) => node.label.toLowerCase().includes(query));
  }, [selectorAddressNodes, addressSearch]);
  const addressVirtualizer = useVirtualizer({
    count: filteredAddressNodes.length,
    getScrollElement: () => addressListParentRef.current,
    estimateSize: () => 44,
    overscan: 8,
  });

  useEffect(() => {
    if (!selectedNodeId || filteredGraph.nodes.some((node) => node.id === selectedNodeId)) {
      return;
    }

    setSelectedNodeId(filteredGraph.nodes[0]?.id ?? null);
  }, [filteredGraph.nodes, selectedNodeId]);

  const nodeMap = useMemo(() => buildNodeMap(filteredGraph.nodes), [filteredGraph.nodes]);
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;

  const relatedIncoming = useMemo(
    () =>
      selectedNode
        ? filteredGraph.edges
            .filter((edge) => edge.target === selectedNode.id)
            .map((edge) => nodeMap.get(edge.source))
            .filter((node): node is TopologyNode => Boolean(node))
        : [],
    [filteredGraph.edges, nodeMap, selectedNode],
  );

  const relatedOutgoing = useMemo(
    () =>
      selectedNode
        ? filteredGraph.edges
            .filter((edge) => edge.source === selectedNode.id)
            .map((edge) => nodeMap.get(edge.target))
            .filter((node): node is TopologyNode => Boolean(node))
        : [],
    [filteredGraph.edges, nodeMap, selectedNode],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const persisted: TopologyUiState = {
      search,
      showConsumers,
      showDlq,
      onlyProblems,
      selectedNodeId,
      collapsedAddressIds: [...collapsedAddressIds],
      viewport,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    const url = new URL(window.location.href);
    url.searchParams.set("q", search);
    url.searchParams.set("consumers", showConsumers ? "1" : "0");
    url.searchParams.set("dlq", showDlq ? "1" : "0");
    url.searchParams.set("problems", onlyProblems ? "1" : "0");
    if (selectedNodeId) {
      url.searchParams.set("node", selectedNodeId);
    } else {
      url.searchParams.delete("node");
    }
    if (collapsedAddressIds.size > 0) {
      url.searchParams.set("collapsed", [...collapsedAddressIds].join(","));
    } else {
      url.searchParams.delete("collapsed");
    }
    window.history.replaceState({}, "", url);
  }, [search, showConsumers, showDlq, onlyProblems, selectedNodeId, collapsedAddressIds, viewport]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <TopologyToolbar
        search={search}
        showConsumers={showConsumers}
        showDlq={showDlq}
        onlyProblems={onlyProblems}
        onSearchChange={(value) => {
          startTransition(() => {
            setSearch(value);
          });
        }}
        onToggleConsumers={setShowConsumers}
        onToggleDlq={setShowDlq}
        onToggleOnlyProblems={setOnlyProblems}
      />

      <div className="flex flex-none flex-wrap items-center gap-2">
        <TopologyLegend />
        {addressNodes.length > 0 ? (
          <details className="app-panel-soft relative rounded-2xl px-3 py-2">
            <summary className="list-none cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Addresses ({selectorAddressNodes.length}) · Colapsadas ({collapsedAddressIds.size})
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-[360px] max-w-[90vw] rounded-2xl border border-[var(--border)] bg-[var(--surface-overlay)] p-3 shadow-[var(--shadow-overlay)]">
              <Input
                value={addressSearch}
                onChange={(event) => setAddressSearch(event.target.value)}
                placeholder="Buscar address..."
                className="h-10"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-[11px] text-muted-foreground transition hover:text-foreground"
                  onClick={() => {
                    setCollapsedAddressIds(new Set());
                  }}
                >
                  Mostrar todas
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3 py-1.5 text-[11px] text-foreground transition hover:bg-[rgba(255,138,61,0.22)]"
                  onClick={() => {
                    setCollapsedAddressIds((current) => {
                      const next = new Set(current);
                      for (const node of filteredAddressNodes) {
                        next.add(node.id);
                      }
                      return next;
                    });
                  }}
                >
                  Colapsar filtradas
                </button>
              </div>

              <div ref={addressListParentRef} className="mt-3 max-h-64 overflow-y-auto pr-1">
                <div
                  className="relative"
                  style={{
                    height: `${addressVirtualizer.getTotalSize()}px`,
                  }}
                >
                  {addressVirtualizer.getVirtualItems().map((virtualItem) => {
                    const address = filteredAddressNodes[virtualItem.index];
                    if (!address) {
                      return null;
                    }

                    const isCollapsed = collapsedAddressIds.has(address.id);
                    return (
                      <div
                        key={address.id}
                        className="absolute left-0 top-0 w-full py-0.5"
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            className="app-checkbox h-4 w-4"
                            checked={isCollapsed}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setCollapsedAddressIds((current) => {
                                const next = new Set(current);
                                if (checked) {
                                  next.add(address.id);
                                } else {
                                  next.delete(address.id);
                                }
                                return next;
                              });
                            }}
                          />
                          {address.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {filteredAddressNodes.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground">Sin coincidencias.</p>
                ) : null}
              </div>
            </div>
          </details>
        ) : null}
      </div>

      {topologyQuery.isLoading ? (
        <div className="app-empty-state flex min-h-0 flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          Cargando topologia real del broker...
        </div>
      ) : null}

      {topologyQuery.isError ? (
        <div className="app-notice app-notice-warning flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm">
          {topologyQuery.error.message}
        </div>
      ) : null}

      {!topologyQuery.isLoading && !topologyQuery.isError && filteredGraph.nodes.length === 0 ? (
        <div className="app-empty-state flex min-h-0 flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
          No hay nodos que coincidan con los filtros activos.
        </div>
      ) : null}

      {!topologyQuery.isLoading && !topologyQuery.isError && filteredGraph.nodes.length > 0 ? (
        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <TopologyCanvas
            nodes={filteredGraph.nodes}
            edges={filteredGraph.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            viewport={viewport}
            onViewportChange={setViewport}
          />
          <TopologyDetailPanel
            selectedNode={selectedNode}
            relatedIncoming={relatedIncoming}
            relatedOutgoing={relatedOutgoing}
          />
        </section>
      ) : null}
    </div>
  );
}

export default function TopologyView(props: TopologyViewProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TopologyViewContent {...props} />
    </QueryClientProvider>
  );
}
