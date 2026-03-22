import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CheckCircle2, RefreshCw } from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AddressDeleteResponse,
  ExplorerMessageDetail,
  PublishMessageResponse,
  QueueConsumeResponse,
  QueueDeleteResponse,
  QueueMessagesResponse,
  QueuePurgeResponse,
} from "../../types/explorer";
import type { QueueSummary } from "../../types/queues";
import { Button } from "../ui/button";
import { ConsumeMessagesModal } from "./ConsumeMessagesModal";
import { CreateAddressModal } from "./CreateAddressModal";
import { CreateQueueModal } from "./CreateQueueModal";
import { DeleteAddressModal } from "./DeleteAddressModal";
import { DeleteQueueModal } from "./DeleteQueueModal";
import { ExplorerMessageDetailPanel } from "./ExplorerMessageDetailPanel";
import { ExplorerMessagesPanel } from "./ExplorerMessagesPanel";
import { ExplorerSidebar } from "./ExplorerSidebar";
import { PublishMessageModal } from "./PublishMessageModal";
import { PurgeQueueModal } from "./PurgeQueueModal";

type ExplorerViewProps = {
  brokerLabel: string;
};

type ApiError = {
  message?: string;
};

type QueueGroup = {
  address: string;
  queues: QueueSummary[];
};

type CreateAddressPayload = {
  address: string;
  routingType: "ANYCAST" | "MULTICAST";
};

type CreateQueuePayload = {
  address: string;
  queueName: string;
  routingType: "ANYCAST" | "MULTICAST";
  durable: boolean;
};

type PublishPayload = {
  body: string;
  durable: boolean;
  headers: Record<string, string>;
  count: number;
};

async function parseResponse<T>(response: Response) {
  let payload: T | ApiError | null = null;

  try {
    payload = (await response.json()) as T | ApiError;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      (payload && typeof payload === "object" && "message" in payload && payload.message) ||
        "La respuesta del backend no fue valida.",
    );
  }

  return payload as T;
}

async function fetchQueues() {
  const response = await fetch("/api/queues", {
    headers: { Accept: "application/json" },
  });

  const payload = await parseResponse<QueueSummary[]>(response);

  if (!Array.isArray(payload)) {
    throw new Error("La respuesta de colas no tiene el formato esperado.");
  }

  return payload;
}

async function fetchQueueMessages(queueName: string) {
  const response = await fetch(
    `/api/queues/${encodeURIComponent(queueName)}/messages?limit=100`,
    {
      headers: { Accept: "application/json" },
    },
  );

  return parseResponse<QueueMessagesResponse>(response);
}

async function fetchMessageDetail(queueName: string, messageId: string) {
  const response = await fetch(
    `/api/queues/${encodeURIComponent(queueName)}/messages/${encodeURIComponent(messageId)}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  return parseResponse<ExplorerMessageDetail>(response);
}

async function createAddressRequest(payload: CreateAddressPayload) {
  const response = await fetch("/api/addresses", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{ address: string; routingType: string; lastUpdatedAt: string }>(response);
}

async function createQueueRequest(payload: CreateQueuePayload) {
  const response = await fetch("/api/queues", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<QueueSummary>(response);
}

async function publishMessageRequest(queueName: string, payload: PublishPayload) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}/publish`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PublishMessageResponse>(response);
}

async function purgeQueueRequest(queueName: string) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}/purge`, {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  return parseResponse<QueuePurgeResponse>(response);
}

async function consumeMessagesRequest(queueName: string, count: number) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}/consume`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ count }),
  });

  return parseResponse<QueueConsumeResponse>(response);
}

async function deleteQueueRequest(queueName: string) {
  const response = await fetch(`/api/queues/${encodeURIComponent(queueName)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  return parseResponse<QueueDeleteResponse>(response);
}

async function deleteAddressRequest(address: string) {
  const response = await fetch(`/api/addresses/${encodeURIComponent(address)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  return parseResponse<AddressDeleteResponse>(response);
}

function groupQueues(queues: QueueSummary[], search: string) {
  const query = search.trim().toLowerCase();
  const groups = new Map<string, QueueSummary[]>();

  for (const queue of queues) {
    const matchesSearch =
      query.length === 0 ||
      queue.name.toLowerCase().includes(query) ||
      queue.address.toLowerCase().includes(query);

    if (!matchesSearch) {
      continue;
    }

    const existing = groups.get(queue.address) ?? [];
    existing.push(queue);
    groups.set(queue.address, existing);
  }

  return [...groups.entries()]
    .map(([address, groupedQueues]) => ({ address, queues: groupedQueues }))
    .sort((left, right) => left.address.localeCompare(right.address))
    .map((group) => ({
      ...group,
      queues: [...group.queues].sort((left, right) => left.name.localeCompare(right.name)),
    })) satisfies QueueGroup[];
}

function ExplorerViewContent({ brokerLabel }: ExplorerViewProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedAddresses, setExpandedAddresses] = useState<Record<string, boolean>>({});
  const [selectedQueueName, setSelectedQueueName] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [isCreateAddressOpen, setIsCreateAddressOpen] = useState(false);
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isConsumeOpen, setIsConsumeOpen] = useState(false);
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [isDeleteQueueOpen, setIsDeleteQueueOpen] = useState(false);
  const [isDeleteAddressOpen, setIsDeleteAddressOpen] = useState(false);
  const [operationNotice, setOperationNotice] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const queuesQuery = useQuery({
    queryKey: ["queues"],
    queryFn: fetchQueues,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const queues = queuesQuery.data ?? [];
  const queueGroups = useMemo(
    () => groupQueues(queues, deferredSearch),
    [queues, deferredSearch],
  );
  const visibleQueues = useMemo(
    () => queueGroups.flatMap((group) => group.queues),
    [queueGroups],
  );
  const selectedQueue = queues.find((queue) => queue.name === selectedQueueName);

  useEffect(() => {
    setExpandedAddresses((current) => {
      let changed = false;
      const next = { ...current };

      for (const group of queueGroups) {
        if (next[group.address] === undefined) {
          next[group.address] = true;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [queueGroups]);

  useEffect(() => {
    setSelectedQueueName((current) => {
      if (visibleQueues.some((queue) => queue.name === current)) {
        return current;
      }

      return visibleQueues[0]?.name ?? "";
    });
  }, [visibleQueues]);

  const messagesQuery = useQuery({
    queryKey: ["queue-messages", selectedQueueName, 100],
    queryFn: () => fetchQueueMessages(selectedQueueName),
    enabled: Boolean(selectedQueueName),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const items = messagesQuery.data?.items ?? [];

    setSelectedMessageId((current) => {
      if (items.some((message) => message.messageId === current)) {
        return current;
      }

      return items[0]?.messageId ?? "";
    });
  }, [messagesQuery.data?.items, selectedQueueName]);

  const detailQuery = useQuery({
    queryKey: ["message-detail", selectedQueueName, selectedMessageId],
    queryFn: () => fetchMessageDetail(selectedQueueName, selectedMessageId),
    enabled: Boolean(selectedQueueName && selectedMessageId),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const createAddressMutation = useMutation({
    mutationFn: createAddressRequest,
    onSuccess: async (result) => {
      setIsCreateAddressOpen(false);
      setOperationNotice(`Address ${result.address} creada. Podras asociarle queues desde la UI.`);
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  const createQueueMutation = useMutation({
    mutationFn: createQueueRequest,
    onSuccess: async (queue) => {
      setIsCreateQueueOpen(false);
      setSearch("");
      setSelectedQueueName(queue.name);
      setOperationNotice(`Queue ${queue.name} creada correctamente.`);
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (payload: PublishPayload) => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para publicar mensajes.");
      }

      return publishMessageRequest(selectedQueueName, payload);
    },
    onSuccess: async (result) => {
      setIsPublishOpen(false);
      setOperationNotice(
        `Se publicaron ${result.sentCount} mensaje(s) en ${result.queueName}.`,
      );
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, 100],
      });
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  const purgeMutation = useMutation({
    mutationFn: () => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para limpiarla.");
      }

      return purgeQueueRequest(selectedQueueName);
    },
    onSuccess: async (result) => {
      setIsPurgeOpen(false);
      setSelectedMessageId("");
      setOperationNotice(`Se limpiaron ${result.removedCount} mensajes de ${result.queueName}.`);
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, 100],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const consumeMutation = useMutation({
    mutationFn: (count: number) => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para consumir mensajes.");
      }

      return consumeMessagesRequest(selectedQueueName, count);
    },
    onSuccess: async (result) => {
      setIsConsumeOpen(false);
      setSelectedMessageId("");
      setOperationNotice(`Consumer temporal: ${result.consumedCount} mensaje(s) consumidos de ${result.queueName}.`);
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, 100],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const deleteQueueMutation = useMutation({
    mutationFn: () => {
      if (!selectedQueueName) {
        throw new Error("Selecciona primero una queue para eliminarla.");
      }

      return deleteQueueRequest(selectedQueueName);
    },
    onSuccess: async (result) => {
      setIsDeleteQueueOpen(false);
      setSelectedQueueName("");
      setSelectedMessageId("");
      setOperationNotice(`Queue ${result.queueName} eliminada.`);
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await queryClient.invalidateQueries({
        queryKey: ["queue-messages", result.queueName, 100],
      });
      await queryClient.invalidateQueries({
        queryKey: ["message-detail", result.queueName],
        exact: false,
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (address: string) => deleteAddressRequest(address),
    onSuccess: async (result) => {
      setIsDeleteAddressOpen(false);
      setOperationNotice(`Address ${result.address} eliminada.`);
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
    },
  });

  async function handleRefresh() {
    await queuesQuery.refetch();

    if (selectedQueueName) {
      await messagesQuery.refetch();
    }

    if (selectedQueueName && selectedMessageId) {
      await detailQuery.refetch();
    }
  }

  return (
    <>
      <div className="space-y-4">
        <section className="app-panel flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Explorer lectura
            </h2>
            <p className="text-sm text-muted-foreground">
              Inspecciona queues y mensajes reales sin salir de Artemis Pulse. Broker actual: {brokerLabel}.
            </p>
          </div>
          <Button variant="secondary" onClick={handleRefresh} disabled={queuesQuery.isFetching}>
            <RefreshCw className={queuesQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {queuesQuery.isFetching ? "Actualizando" : "Refrescar"}
          </Button>
        </section>

        {operationNotice ? (
          <div className="app-notice app-notice-success flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>{operationNotice}</span>
            <button
              type="button"
              className="ml-auto text-current opacity-80 transition hover:opacity-100"
              onClick={() => setOperationNotice(null)}
            >
              cerrar
            </button>
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
          <ExplorerSidebar
            search={search}
            onSearchChange={(value) => {
              startTransition(() => {
                setSearch(value);
              });
            }}
            groups={queueGroups}
            expandedAddresses={expandedAddresses}
            onToggleAddress={(address) => {
              setExpandedAddresses((current) => ({
                ...current,
                [address]: !current[address],
              }));
            }}
            selectedQueueName={selectedQueueName}
            onSelectQueue={(queueName) => setSelectedQueueName(queueName)}
            isLoading={queuesQuery.isLoading}
            isError={queuesQuery.isError}
            errorMessage={queuesQuery.error?.message}
            onOpenCreateAddress={() => setIsCreateAddressOpen(true)}
            onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
            onOpenDeleteAddress={() => setIsDeleteAddressOpen(true)}
          />

          <ExplorerMessagesPanel
            queue={selectedQueue}
            data={messagesQuery.data}
            selectedMessageId={selectedMessageId}
            onSelectMessage={setSelectedMessageId}
            isLoading={messagesQuery.isLoading}
            isFetching={messagesQuery.isFetching}
            isError={messagesQuery.isError}
            errorMessage={messagesQuery.error?.message}
            onRefresh={() => messagesQuery.refetch()}
            onOpenPublish={() => setIsPublishOpen(true)}
            onOpenConsume={() => setIsConsumeOpen(true)}
            onOpenPurge={() => setIsPurgeOpen(true)}
            onOpenDeleteQueue={() => setIsDeleteQueueOpen(true)}
          />

          <ExplorerMessageDetailPanel
            queue={selectedQueue}
            selectedMessageId={selectedMessageId}
            detail={detailQuery.data}
            isLoading={detailQuery.isLoading}
            isFetching={detailQuery.isFetching}
            isError={detailQuery.isError}
            errorMessage={detailQuery.error?.message}
            onRefresh={() => detailQuery.refetch()}
          />
        </section>
      </div>

      <CreateAddressModal
        open={isCreateAddressOpen}
        initialAddress={selectedQueue?.address}
        onClose={() => {
          if (!createAddressMutation.isPending) {
            setIsCreateAddressOpen(false);
            createAddressMutation.reset();
          }
        }}
        onSubmit={async (payload) => {
          await createAddressMutation.mutateAsync(payload);
        }}
        isPending={createAddressMutation.isPending}
        errorMessage={createAddressMutation.error?.message}
      />

      <CreateQueueModal
        open={isCreateQueueOpen}
        initialAddress={selectedQueue?.address}
        onClose={() => {
          if (!createQueueMutation.isPending) {
            setIsCreateQueueOpen(false);
            createQueueMutation.reset();
          }
        }}
        onSubmit={async (payload) => {
          await createQueueMutation.mutateAsync(payload);
        }}
        isPending={createQueueMutation.isPending}
        errorMessage={createQueueMutation.error?.message}
      />

      <PublishMessageModal
        open={isPublishOpen}
        queue={selectedQueue}
        onClose={() => {
          if (!publishMutation.isPending) {
            setIsPublishOpen(false);
            publishMutation.reset();
          }
        }}
        onSubmit={async (payload) => {
          await publishMutation.mutateAsync(payload);
        }}
        isPending={publishMutation.isPending}
        errorMessage={publishMutation.error?.message}
      />

      <ConsumeMessagesModal
        open={isConsumeOpen}
        queueName={selectedQueue?.name}
        onClose={() => {
          if (!consumeMutation.isPending) {
            setIsConsumeOpen(false);
            consumeMutation.reset();
          }
        }}
        onSubmit={async (count) => {
          await consumeMutation.mutateAsync(count);
        }}
        isPending={consumeMutation.isPending}
        errorMessage={consumeMutation.error?.message}
      />

      <PurgeQueueModal
        open={isPurgeOpen}
        queueName={selectedQueue?.name}
        onClose={() => {
          if (!purgeMutation.isPending) {
            setIsPurgeOpen(false);
            purgeMutation.reset();
          }
        }}
        onConfirm={async () => {
          await purgeMutation.mutateAsync();
        }}
        isPending={purgeMutation.isPending}
        errorMessage={purgeMutation.error?.message}
      />

      <DeleteQueueModal
        open={isDeleteQueueOpen}
        queue={selectedQueue}
        onClose={() => {
          if (!deleteQueueMutation.isPending) {
            setIsDeleteQueueOpen(false);
            deleteQueueMutation.reset();
          }
        }}
        onConfirm={async () => {
          await deleteQueueMutation.mutateAsync();
        }}
        isPending={deleteQueueMutation.isPending}
        errorMessage={deleteQueueMutation.error?.message}
      />

      <DeleteAddressModal
        open={isDeleteAddressOpen}
        initialAddress={selectedQueue?.address}
        onClose={() => {
          if (!deleteAddressMutation.isPending) {
            setIsDeleteAddressOpen(false);
            deleteAddressMutation.reset();
          }
        }}
        onConfirm={async (address) => {
          await deleteAddressMutation.mutateAsync(address);
        }}
        isPending={deleteAddressMutation.isPending}
        errorMessage={deleteAddressMutation.error?.message}
      />
    </>
  );
}

export default function ExplorerView(props: ExplorerViewProps) {
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
      <ExplorerViewContent {...props} />
    </QueryClientProvider>
  );
}
